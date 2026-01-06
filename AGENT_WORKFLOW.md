
# AI Agent Workflow Log

## Agents Used
- **Antigravity (Google DeepMind)**: Used for code auditing, generating fixes, and drafting verification scripts.
- **Human Developer**: Responsible for prompt engineering, logic verification, reviewing code changes, and final validation.

## Prompts & Outputs

### Phase 1: Exploration & Audit
- **Goal**: Understand why the Banking and Pooling modules were failing integration tests.
- **Prompt strategy**: Asked the agent to trace the execution flow of `CreatePool` and `ApplyBanked`.
- **Outcome**: The agent identified that `ApplyBanked` was missing the debit logic (balance deduction) and `CreatePool` implemented basic validation but lacked the surplus reallocation algorithm required by Article 21.

### Phase 2: Debugging Logic (R003)
- **Goal**: Fix the issue where ship R003 reported a Compliance Balance of 0 despite having a deficit.
- **Collaboration**: 
  - I suspected a data initialization issue.
  - The agent suggested a "Compute-on-Miss" pattern in the `GetComplianceBalance` use case.
  - **Correction**: Initial fixes didn't work because stale `0` values persisted in the database. I directed the agent to create a script to clean up specific rows, forcing a re-calculation.

### Phase 3: Unit Mismatch Resolution
- **Goal**: Address "impossible" negative values (e.g., -870,000,000) appearing in the UI.
- **Investigation**: The agent highlighted that `GHGIntensity` calculations use Grams for precision, while the Frontend expects Tonnes.
- **Fix**: We implemented a transformation layer in the Controllers (`BankingController`, `PoolingController`) to handle the conversion `(Grams / 1,000,000)` at the API boundary, keeping the Domain Layer pure.

## Validation / Corrections
All AI-generated code was subjected to manual review and verification:
- **R003 Fix**: verified by deleting local DB rows and hitting the endpoint to confirm the correct negative value appeared.
- **Pooling Logic**: verified by manually constructing a pool payload with one surplus and one deficit ship; confirmed that the deficit ship's balance became 0 (not positive) and the surplus ship's balance decreased accordingly.
- **Rejection Logic**: Tested with a net-negative pool to ensure the system correctly rejected it with a 400 error.

## Observations
- **Precision vs. Display**: The decision to keep the backend in Grams was technically sound for avoiding floating-point errors, but created a significant UX gap that required an explicit adapter layer.
- **State Management**: The most stubborn bugs were state-related (stale DB records) rather than logic-related. AI tools often assume a clean slate unless explicitly told to check for existing bad data.

## Best Practices Followed
- **Hexagonal Architecture**: Strictly maintained. Protocol formatting issues (Units) were solved in the Adapters, not the Domain.
- **Iterative Verification**: We didn't apply "blind fixes". Each major change was preceded by a reproduction script or specific manual test.
