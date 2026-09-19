import pytest
import os
import sys

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


@pytest.fixture
def mock_audit_report_passed():
    """Mock audit report payload demonstrating a critical reentrancy finding with PoC."""
    return """
# Security Audit Report for VaultContract
Auditor: 0xAuditorSecTeam77
Target: https://github.com/defi-protocol/vault-core
Severity: CRITICAL
Vulnerability: State update after external call leading to balance drain (Reentrancy).

## Proof of Concept (PoC)
1. Attacker calls `withdraw(amount)`
2. Target transfers native GEN to attacker contract before decrementing `userBalances[msg.sender]`
3. Attacker's fallback function re-enters `withdraw(amount)` recursively draining the contract.

```solidity
function attack() external payable {
    vault.withdraw(1 ether);
}
receive() external payable {
    if (address(vault).balance >= 1 ether) {
        vault.withdraw(1 ether);
    }
}
```

## Remediation
Apply Checks-Effects-Interactions pattern or OpenZeppelin ReentrancyGuard:
```solidity
userBalances[msg.sender] -= amount;
(bool success, ) = msg.sender.call{value: amount}("");
require(success, "Transfer failed");
```
Depth Score: 95/100
"""


@pytest.fixture
def mock_audit_report_rejected():
    """Mock audit report payload that contains trivial / false-positive linter output."""
    return """
# Automated Scan Result
Auditor: BotScript101
Target: https://github.com/defi-protocol/vault-core

Found 1 issue:
- Line 42: Comment indentation is inconsistent (2 spaces instead of 4).
Severity: CRITICAL ($50,000 bounty requested)
PoC: None needed, please format code with prettier.
"""