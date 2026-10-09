from streamlit.testing.v1 import AppTest
import pathlib
def test_app_runs():
    at = AppTest.from_file(str(pathlib.Path(__file__).resolve().parent.parent / 'app.py'), default_timeout=60).run()
    assert not at.exception, at.exception
    assert len(at.tabs) == 5
if __name__ == '__main__':
    test_app_runs(); print('app renders without exceptions')
