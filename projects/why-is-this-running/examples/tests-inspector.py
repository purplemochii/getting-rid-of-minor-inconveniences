from lib.process_inspector import list_top_processes

def test_list_top_processes():
    procs = list_top_processes()
    assert len(procs) > 0
    for p in procs:
        assert 'pid' in p
        assert 'name' in p
        assert 'cpu_percent' in p