import httpx
from test_api import BASE


def data(**changes):
    values = dict(
        qualityReady=True,
        observations=["No visible defect"],
        functionalStatus="pass",
        safetyConcern=False,
        repairable=False,
        resaleValue=80,
        asIsValue=40,
        repairCost=15,
        handlingCost=5,
        salvageValue=2,
    )
    values.update(changes)
    return values


def evaluate(**changes):
    return httpx.post(BASE + "/api/inspection/disposition", json=data(**changes))


def test_clean_return_can_be_restocked():
    r = evaluate()
    assert r.status_code == 200, r.text
    assert r.json()["route"] == "restock"
    assert r.json()["estimatedRecovery"] == 75


def test_cosmetic_repair_compares_costs():
    r = evaluate(observations=["Visible surface damage"], repairable=True)
    assert r.json()["route"] == "refurbish"
    assert r.json()["estimatedRecovery"] == 60


def test_expensive_repair_prefers_current_condition_resale():
    r = evaluate(
        observations=["Visible surface damage"], repairable=True, repairCost=70
    )
    assert r.json()["route"] == "resell"


def test_safety_overrides_economics():
    r = evaluate(safetyConcern=True, qualityReady=False)
    assert r.json()["route"] == "quarantine"
    assert r.json()["estimatedRecovery"] is None


def test_missing_evidence_and_failed_quality_block_restock():
    assert evaluate(functionalStatus="unknown").json()["route"] == "inspect"
    assert evaluate(qualityReady=False).json()["route"] == "retake"


def test_failed_function_excludes_resale():
    r = evaluate(functionalStatus="fail")
    assert r.json()["route"] == "recycle"
    assert all(x["route"] not in ("resell", "restock") for x in r.json()["options"])


def test_invalid_and_contradictory_inputs_rejected():
    assert evaluate(repairCost=-1).status_code == 400
    assert evaluate(resaleValue=None).status_code == 400
    assert evaluate(resaleValue=1.001).status_code == 400
    assert (
        evaluate(
            observations=["No visible defect", "Visible surface damage"]
        ).status_code
        == 400
    )
