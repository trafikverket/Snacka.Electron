import { dispatch } from '../../../store';
import { WEBVIEW_TITLE_CHANGED } from '../../../ui/actions';
import { setTitle } from '../title';
import { getServerUrl } from '../urls';

jest.mock('../../../store', () => ({
  dispatch: jest.fn(),
}));

jest.mock('../urls', () => ({
  getServerUrl: jest.fn(),
}));

const dispatchMock = dispatch as jest.MockedFunction<typeof dispatch>;
const getServerUrlMock = getServerUrl as jest.MockedFunction<
  typeof getServerUrl
>;

describe('servers/preload/title', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  it('appends the server URL when title is Snacka and server is not snacka.app.trafikverket.se', () => {
    getServerUrlMock.mockReturnValue('https://example.rocket');

    setTitle('Snacka');

    expect(dispatchMock).toHaveBeenCalledWith({
      type: WEBVIEW_TITLE_CHANGED,
      payload: {
        url: 'https://example.rocket',
        title: 'Snacka - https://example.rocket',
      },
    });
  });

  it('keeps Snacka title unchanged for snacka.app.trafikverket.se', () => {
    getServerUrlMock.mockReturnValue('https://snacka.app.trafikverket.se');

    setTitle('Snacka');

    expect(dispatchMock).toHaveBeenCalledWith({
      type: WEBVIEW_TITLE_CHANGED,
      payload: {
        url: 'https://snacka.app.trafikverket.se',
        title: 'Snacka',
      },
    });
  });

  it('passes through non-Snacka titles', () => {
    getServerUrlMock.mockReturnValue('https://chat.example');

    setTitle('My Workspace');

    expect(dispatchMock).toHaveBeenCalledWith({
      type: WEBVIEW_TITLE_CHANGED,
      payload: {
        url: 'https://chat.example',
        title: 'My Workspace',
      },
    });
  });

  it('ignores non-string titles', () => {
    const dispatchCallCount = dispatchMock.mock.calls.length;

    setTitle(undefined as unknown as string);

    expect(dispatchMock).toHaveBeenCalledTimes(dispatchCallCount);
  });
});
