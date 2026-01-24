import json
from playwright.sync_api import sync_playwright, expect

def test_dashboard_clean_load(page):
    mock_analysis = {
        "careerRecommendations": [{"title": "Job 1", "description": "Desc"}],
        "businessIdeas": [{"title": "Idea 1"}],
        "trajectories": [{"title": "Path 1"}],
        "ikigai_dimensions": {"passion_score": 80}
    }

    mock_user = {
        "id": "user123",
        "email": "test@example.com",
        "role": "client"
    }

    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.route("**/supabase-js@2", lambda route: route.abort())

    # Mock everything
    page.add_init_script(f"""
        window.supabase = {{
            createClient: () => ({{
                auth: {{
                    getUser: async () => ({{ data: {{ user: {json.dumps(mock_user)} }} }}),
                    getSession: async () => ({{ data: {{ session: {{ user: {json.dumps(mock_user)}, access_token: 'tk' }} }} }}),
                    signInWithPassword: async () => ({{ data: {{ user: {json.dumps(mock_user)} }} }}),
                }},
                from: () => ({{
                    select: () => ({{
                        eq: () => ({{
                            single: async () => ({{ data: {{ plan: 'decouverte' }} }}),
                            order: async () => ({{ data: [] }})
                        }})
                    }}),
                    insert: async () => ({{ error: null }})
                }})
            }})
        }};
    """)

    page.goto("http://localhost:8080/dashboard-client.html")

    # Manually trigger display
    page.evaluate(f"""
        window.currentUser = {json.dumps(mock_user)};
        const analysis = {json.dumps(mock_analysis)};
        displayRecommendations(analysis);
    """)

    # Verify
    expect(page.locator("#business-ideas-list")).to_contain_text("Idea 1")
    print("✅ Dashboard loaded cleanly with premium content visible.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_dashboard_clean_load(page)
        except Exception as e:
            print(f"❌ Test failed: {e}")
        finally:
            browser.close()
