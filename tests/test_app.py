import unittest

from app import app, outdoor_score


class TouchGrassSmokeTests(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_health_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["ok"])

    def test_home_page_loads(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Touch Grass", response.data)

    def test_demo_plan_is_explicitly_demo(self):
        response = self.client.post("/api/plan", json={
            "preferences": {"city": "Ahmedabad", "activity": "Hiking / Walk", "duration": 45},
            "api_key": "",
        })
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["source"], "demo")
        self.assertIn("steps", payload["plan"])

    def test_gujarati_demo_plan_uses_selected_language(self):
        response = self.client.post("/api/plan", json={
            "preferences": {"city": "Ahmedabad", "activity": "Hiking / Walk", "duration": 45, "language": "Gujarati"},
            "api_key": "",
        })
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["source"], "demo")
        self.assertIn("તમારા હાલના મૂડ", payload["plan"]["summary"])
        self.assertIn("પાણીની બોટલ", payload["plan"]["checklist"])

    def test_hindi_demo_plan_uses_selected_language(self):
        response = self.client.post("/api/plan", json={
            "preferences": {"city": "Ahmedabad", "activity": "Hiking / Walk", "duration": 45, "language": "Hindi"},
            "api_key": "",
        })
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["source"], "demo")
        self.assertIn("आपके मौजूदा मूड", payload["plan"]["summary"])
        self.assertIn("पानी की बोतल", payload["plan"]["checklist"])

    def test_rejects_non_free_or_unsupported_manual_model(self):
        response = self.client.post("/api/plan", json={
            "preferences": {"city": "Ahmedabad"},
            "api_key": "sk-or-test-placeholder",
            "model": "openai/gpt-4o",
        })
        self.assertEqual(response.status_code, 400)

    def test_outdoor_score_accounts_for_aqi_and_uv(self):
        score = outdoor_score(29.6, 0, 79, 7.05, 12)
        self.assertLess(score, 100)
        self.assertGreaterEqual(score, 0)


if __name__ == "__main__":
    unittest.main()
