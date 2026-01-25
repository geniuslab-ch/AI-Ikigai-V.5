from playwright.sync_api import sync_playwright, expect
import json
import os

def test_invitation_flow(page):
    # Mock user session
    mock_coach = {
        "id": "coach123",
        "email": "coach@example.com",
        "role": "coach",
        "name": "Sophie Coach"
    }

    # Intercept Supabase calls
    page.route("**/supabase-js@2", lambda route: route.abort())

    # Init script to mock Supabase and Backend
    page.add_init_script(f"""
        // Mock Console and Alert
        window.alert = (msg) => console.log('ALERT:', msg);

        // Mock Supabase
        window.supabase = {{
            createClient: () => ({{
                auth: {{
                    getUser: async () => ({{ data: {{ user: {json.dumps(mock_coach)} }} }}),
                    getSession: async () => ({{ data: {{ session: {{ user: {json.dumps(mock_coach)}, access_token: 'tk' }} }} }}),
                }},
                from: (table) => ({{
                    select: () => ({{
                        single: async () => ({{ data: {{ plan: 'premium_coach', role: 'coach' }} }}),
                        eq: () => ({{
                            single: async () => ({{ data: {{ id: 'invitation123' }} }}),
                            select: () => ({{ data: [], error: null }})
                        }}),
                        in: () => ({{
                            order: async () => ({{ data: [] }})
                        }})
                    }}),
                    insert: () => ({{
                        select: () => ({{
                            single: async () => ({{ data: {{ id: 'invitation123' }}, error: null }})
                        }})
                    }})
                }})
            }})
        }};

        // Mock fetch to backend (invitation email)
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {{
            console.log('FETCH URL:', url);
            if (url && url.includes('/api/send-invitation')) {{
                console.log('Intercepted invitation fetch');
                return {{
                    ok: true,
                    json: async () => ({{ success: true, message: 'Email simulé' }})
                }};
            }}
            if (url && url.includes('/api/notify/new-client')) {{
                return {{ ok: true }};
            }}
            if (url && url.includes('supabase')) {{
                 return {{ ok: true, json: async () => ({{}}) }};
            }}
            // Fallback for other fetches (e.g. Supabase REST if not caught by window.supabase)
            return {{ ok: true, json: async () => ({{}}) }};
        }};
    """)

    # Listen to console
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

    # Load page
    cwd = os.getcwd()
    page.goto(f"file://{cwd}/dashboard-coach.html")

    # Manually Inject Coach Data if needed (wait for load)
    page.wait_for_timeout(1000) # Wait for init
    page.evaluate(f"""
        if (window.CoachDashboard) {{
            window.CoachDashboard.coachData = {json.dumps(mock_coach)};
        }}
    """)

    # Click "Nouveau client"
    print("Clicking Nouveau client...")
    page.locator("button.btn-primary", has_text="Nouveau client").first.click()

    # Fill form
    print("Filling form...")
    page.fill("#newClientName", "Jean Test")
    page.fill("#newClientEmail", "jean@test.com")

    # Submit
    print("Submitting...")
    page.click("#submitClientBtn")

    # Verify Success Modal Content
    print("Verifying success state...")
    # Wait for the modal content to update
    try:
        expect(page.locator("text=Invitation créée pour Jean Test")).to_be_visible(timeout=5000)
    except Exception as e:
        print("Wait failed, checking for alerts or errors...")
        # Check if button is still loading
        if page.locator("#submitClientBtn").inner_text() == "Envoi...":
            print("Button is stuck in loading state")
        raise e

    # Should see the link input
    link_input = page.locator("input[readonly]")
    expect(link_input).to_be_visible()

    # Link should contain correct params
    value = link_input.input_value()
    print(f"Generated Link: {value}")
    assert "auth.html" in value
    assert "role=client" in value
    assert "invitation_id=invitation123" in value

    # Verify "Copy" button
    copy_btn = page.get_by_text("Copier")
    expect(copy_btn).to_be_visible()

    print("✅ Invitation flow verified: Modal updated with link.")
    page.screenshot(path="verification/invitation_success.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_invitation_flow(page)
        except Exception as e:
            print(f"❌ Test failed: {e}")
        finally:
            browser.close()
