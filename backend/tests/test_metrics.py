from datetime import date

from app.agent.tools import normalize_report
from app.services.metrics import get_inventory_alerts, get_kpis, get_products, get_trend, resolve_range


def test_kpis_use_net_sales_and_same_scope(db):
    today = date.today()
    kpis = get_kpis(db, today, today)
    assert kpis["sales"] == 100.0
    assert kpis["orders"] == 2
    assert kpis["visitors"] == 1000
    assert kpis["conversion"] == 0.2
    assert kpis["gross_margin"] == 50.0
    assert kpis["refund_amount"] == 50.0


def test_trend_and_products_are_consistent(db):
    today = date.today()
    trend = get_trend(db, today, today)
    assert trend["labels"] == [today.isoformat()]
    assert trend["sales"] == [100.0]
    assert trend["orders"] == [2]

    products = get_products(db, today, today)
    assert products
    assert products[0]["id"] == "P1"
    assert products[0]["sales"] == 100.0


def test_inventory_alert_uses_safety_stock(db):
    alerts = get_inventory_alerts(db)
    assert len(alerts) == 1
    assert alerts[0]["id"] == "P1"
    assert alerts[0]["level"] in {"high", "medium"}


def test_range_resolution():
    start, end, key = resolve_range("7d", None, None)
    assert (end - start).days == 6
    assert key == "7d"

    start, end, key = resolve_range("today", None, None)
    assert start == end
    assert key == "today"


def test_llm_report_strings_are_normalized_with_evidence():
    deterministic = {
        "headline": "fallback",
        "summary": "fallback",
        "findings": [{"text": "fallback", "evidence_ids": ["E1"], "confidence": "high"}],
        "causes": [],
        "actions": [{"priority": "P2", "title": "fallback", "detail": "", "evidence_ids": ["E1"]}],
        "data_gaps": [],
        "source": "fallback",
    }
    payload = {
        "headline": "销售下降",
        "summary": "库存与转化率需要关注",
        "findings": ["销售额下降，库存存在风险"],
        "causes": ["转化率下降"],
        "actions": ["优先补货"],
        "data_gaps": ["广告花费"],
    }
    result = normalize_report(payload, deterministic, {"E1", "E10"})
    assert result["source"] == "llm"
    assert result["findings"][0]["evidence_ids"]
    assert result["actions"][0]["title"] == "优先补货"
