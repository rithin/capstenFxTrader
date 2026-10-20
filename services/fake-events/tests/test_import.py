def test_module_imports():
    import fake_events.main as m

    assert m.SERVICE
