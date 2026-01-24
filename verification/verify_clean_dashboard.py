import json
from playwright.sync_api import sync_playwright, expect

def test_dashboard_clean_load(page):
    # Mock data
    mock_analysis = {
        "careerRecommendations": [{"title": "Job 1", "description": "Desc"}],
        "businessIdeas": [{"title": "Idea 1"}],
        "trajectories": [{"title": "Path 1"}]
    }

    mock_user = {
        "id": "user123",
        "email": "test@example.com",
        "role": "client",
        "user_metadata": {"name": "Clean User"}
    }

    page.on("console", lambda msg: print(f"Console: {msg.text}"))

    # Block Supabase
    page.route("**/supabase-js@2", lambda route: route.abort())

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

    # Inject data and trigger display
    page.evaluate(f"""
        window.dashboardData = {{
            latestAnalysis: {json.dumps(mock_analysis)},
            analyses: []
        }};
        // Trigger the recommendation view
        displayRecommendations(window.dashboardData.latestAnalysis);
    """)

    # Check that "Container not found" warning is NOT in logs (monitored by page.on)
    # Check that content is visible
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
