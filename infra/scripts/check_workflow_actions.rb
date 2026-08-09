#!/usr/bin/env ruby
# frozen_string_literal: true

require "yaml"

FULL_SHA = /\A[0-9a-f]{40}\z/
DOCKER_DIGEST = %r{\Adocker://[^@]+@sha256:[0-9a-f]{64}\z}
IMAGE_DIGEST = /@sha256:[0-9a-f]{64}\z/

def fail_check(path, message)
  warn "#{path}: #{message}"
  exit 1
end

def validate_uses(path, step)
  reference = step["uses"]
  fail_check(path, "uses must be a string") unless reference.is_a?(String)

  if reference.start_with?("./")
    return
  elsif reference.start_with?("docker://")
    unless DOCKER_DIGEST.match?(reference)
      fail_check(path, "Docker action must use a sha256 digest: #{reference}")
    end
  else
    revision = reference.split("@", 2)[1]
    unless FULL_SHA.match?(revision.to_s)
      fail_check(path, "External action must use a full commit SHA: #{reference}")
    end
  end

  return unless reference.start_with?("actions/checkout@")

  options = step["with"]
  persisted = options.is_a?(Hash) ? options["persist-credentials"] : nil
  unless persisted == false || persisted == "false"
    fail_check(path, "actions/checkout must set persist-credentials: false")
  end
end

def validate_permissions(path, document)
  expected_root = {"contents" => "read"}
  unless document["permissions"] == expected_root
    fail_check(path, "root permissions must be exactly contents: read")
  end

  jobs = document["jobs"]
  fail_check(path, "jobs must be a YAML object") unless jobs.is_a?(Hash)
  jobs.each do |job_name, job|
    fail_check(path, "job #{job_name} must be a YAML object") unless job.is_a?(Hash)
    next unless job.key?("permissions")

    permissions = job["permissions"]
    read_only = permissions.is_a?(Hash) && permissions.values.all? do |value|
      ["read", "none"].include?(value)
    end
    unless read_only
      fail_check(path, "job #{job_name} permissions must be read-only")
    end
  end
end

def validate_ci_image(path, location, reference)
  unless reference.is_a?(String) && IMAGE_DIGEST.match?(reference)
    fail_check(path, "#{location} image must use an immutable sha256 digest")
  end
end

def validate_job_images(path, document)
  document["jobs"].each do |job_name, job|
    container = job["container"]
    if container
      reference = container.is_a?(Hash) ? container["image"] : container
      validate_ci_image(path, "job #{job_name} container", reference)
    end

    services = job["services"]
    next unless services
    fail_check(path, "job #{job_name} services must be a YAML object") unless services.is_a?(Hash)
    services.each do |service_name, service|
      reference = service.is_a?(Hash) ? service["image"] : service
      validate_ci_image(path, "job #{job_name} service #{service_name}", reference)
    end
  end
end

def validate_secret_expression(path, value)
  return unless value.is_a?(String) && value.include?("${{") && value.match?(/secrets/i)

  remaining = value.gsub(/secrets\.[A-Za-z_][A-Za-z0-9_]*/i, "")
  if remaining.match?(/\bsecrets\b/i)
    fail_check(path, "whole secret context expressions are forbidden")
  end
end

def walk(path, node)
  case node
  when Hash
    if node.key?("secrets") && node["secrets"].to_s.strip == "inherit"
      fail_check(path, "secrets: inherit is forbidden")
    end
    validate_uses(path, node) if node.key?("uses")
    node.each_value do |value|
      validate_secret_expression(path, value)
      walk(path, value)
    end
  when Array
    node.each { |value| walk(path, value) }
  end
end

fail_check("workflows", "no workflow files were supplied") if ARGV.empty?

ARGV.each do |path|
  document = YAML.safe_load(File.read(path), aliases: false, filename: path)
  fail_check(path, "workflow must be a YAML object") unless document.is_a?(Hash)
  validate_permissions(path, document)
  validate_job_images(path, document)
  walk(path, document)
rescue Psych::Exception => e
  fail_check(path, "invalid YAML: #{e.message}")
end
