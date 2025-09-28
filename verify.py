# verify.py

import os
import sys
from playwright.sync_api import sync_playwright, expect

def run_verification():
    """
    Launches a browser, navigates to the preview URL, and takes a screenshot.

    This script is designed to be run in a CI environment to verify that
    the deployed preview is accessible and renders correctly.
    """
    # The preview URL is passed as a command-line argument.
    # We exit if it's not provided, as there's nothing to test.
    if len(sys.argv) < 2:
        print("::error::Preview URL not provided. Skipping verification.")
        sys.exit(1)

    preview_url = sys.argv[1]

    print(f"Starting verification for URL: {preview_url}")

    try:
        with sync_playwright() as p:
            # We use Chromium for this verification test.
            browser = p.chromium.launch()
            page = browser.new_page()

            # Navigate to the deployed preview URL.
            # We set a timeout to avoid the script hanging indefinitely.
            page.goto(preview_url, timeout=60000)

            # Check for a key element on the page to confirm it loaded correctly.
            # In this case, we're looking for the main heading.
            # The `expect` function will wait for the element and raise an error if not found.
            heading = page.locator('h1')
            expect(heading).to_be_visible()
            expect(heading).to_contain_text("Skeptical Wombat")

            # If the verification is successful, we take a screenshot for archival purposes.
            screenshot_path = "verification_success.png"
            page.screenshot(path=screenshot_path)
            print(f"Successfully verified page content. Screenshot saved to {screenshot_path}")

            browser.close()

    except Exception as e:
        # If any part of the verification fails, we print an error message
        # and save a screenshot for debugging.
        print(f"::error::Verification failed: {e}")

        # We attempt to take a screenshot even on failure to help diagnose the issue.
        try:
            # We need a new page object if the previous one failed.
            with sync_playwright() as p_fail:
                browser_fail = p_fail.chromium.launch()
                page_fail = browser_fail.new_page()
                page_fail.goto(preview_url, timeout=30000)
                error_screenshot_path = "verification_error.png"
                page_fail.screenshot(path=error_screenshot_path)
                browser_fail.close()
                print(f"Error screenshot saved to {error_screenshot_path}")
        except Exception as screenshot_error:
            print(f"::error::Could not take an error screenshot: {screenshot_error}")

        sys.exit(1)

if __name__ == "__main__":
    run_verification()