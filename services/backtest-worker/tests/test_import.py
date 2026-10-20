def test_module_imports():
    import backtest_worker.main as m

    assert m.SERVICE
