#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
. "$script_dir/common.sh"
cd "$frontend_dir"

if [[ -z "${CHROME_PATH:-}" ]]; then
    case "$(uname -s)" in
        Darwin)
            chrome_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            if [[ -x "$chrome_path" ]]; then
                export CHROME_PATH="$chrome_path"
            fi
            ;;
        Linux)
            for chrome_command in google-chrome google-chrome-stable chromium chromium-browser; do
                if chrome_path="$(command -v "$chrome_command" 2>/dev/null)"; then
                    export CHROME_PATH="$chrome_path"
                    break
                fi
            done
            ;;
    esac
fi

if [[ -z "${CHROME_PATH:-}" || ! -x "$CHROME_PATH" ]]; then
    echo "Lighthouse requires an executable Chrome binary; set CHROME_PATH explicitly." >&2
    exit 1
fi

rm -rf .lighthouseci performance/reports/lighthouse
lighthouse_started_at_epoch_ms="$(( $(date +%s) * 1000 ))"

npm run build
LHCI_COLLECT_MODE=anonymous npm run lhci -- collect --config=./lighthouserc.cjs
LHCI_COLLECT_MODE=authenticated npm run lhci -- collect --config=./lighthouserc.cjs --additive
npm run lhci -- assert --config=./lighthouserc.cjs
npm run lhci -- upload --config=./lighthouserc.cjs
node scripts/verify_lighthouse_reports.mjs \
    performance/reports/lighthouse \
    "$lighthouse_started_at_epoch_ms"
