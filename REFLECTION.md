
# Reflection on Development

## Efficiency Gains & AI Utility
Using an AI assistant acted like a force multiplier for the "detective work" phase of debugging. The most significant efficiency gain was in **Root Cause Analysis**. When the Pooling tab showed nonsensical values (e.g., -870M), the agent quickly cross-referenced the `GHGIntensity` value object logic with the controller outputs to identify the unit mismatch (Grams vs. Tonnes). Manually tracing this data flow through the Hexagonal layers would have been much slower.

## Challenges & Manual Reasoning
While the AI was excellent at suggesting code changes, it struggled with **State Persistence**.
- **The Stale Data Trap**: The AI correctly implemented a "Compute-on-Miss" fix for the R003 ship, but it failed to realize that existing "0" records in the database would prevent the new logic from running. I had to manually intervene to clean the database state to validate the fix.
- **Context Constraints**: The AI treats files in isolation. I had to ensure that changes in the Backend (Unit Conversion) were properly communicated to the expectations of the Frontend, ensuring the `PoolingTab` received the data format it expected.

## Key Learnings
1.  **Architecture Matters**: The Hexagonal Architecture proved its value. We were able to fix the Unit Mismatch issue entirely in the `Adapters` layer (Controllers) without touching the core `Domain` logic or the `Use Cases`. This reduced the risk of regression significantly.
2.  **Verify, Don't Trust**: The initial AI solution for pooling was syntactically correct but mathematically incomplete (ignoring the "deficit must be covered" rule). Manual verification against the Article 21 spec was essential to ensure compliance.

## Conclusion
This assignment highlighted that while AI is a powerful tool for accelerating implementation and finding bugs, **engineering judgment** remains critical for architectural integrity and verifying business requirements.
