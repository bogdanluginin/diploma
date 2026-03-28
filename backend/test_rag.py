import os
import sys

# Ensure backend modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents import AgentSystem

agent = AgentSystem()
print("Starting Test...")
result = agent.run_medical_council("у мене кашель вже 3 тижні, потію вночі і схуднув", interaction_mode="diagnosis")

print("\n=== FINAL REPORT ===")
print(result["final_report"])

print("\n=== LOGS ===")
for log in result["logs"]:
    print(log)
