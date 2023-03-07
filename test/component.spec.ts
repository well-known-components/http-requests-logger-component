import { IHttpServerComponent, ILoggerComponent } from '@well-known-components/interfaces'
import { createHttRequestsLogger } from '../src/component'
import { RequestLoggerConfigurations, Verbosity } from '../src/types'

let options: RequestLoggerConfigurations
let loggerMock: ILoggerComponent
let serverMock: IHttpServerComponent<IHttpServerComponent.DefaultContext<object>>
let mockedContext: IHttpServerComponent.DefaultContext<object>
let storedMiddleware: (
  ctx: IHttpServerComponent.DefaultContext<object>,
  next: () => Promise<IHttpServerComponent.IResponse>
) => Promise<IHttpServerComponent.IResponse>
let mockedNext: () => Promise<IHttpServerComponent.IResponse>
let mockedResponse: IHttpServerComponent.IResponse
let loggers: (ILoggerComponent.ILogger & { name: string })[]

beforeEach(() => {
  options = {}
  loggers = []
  loggerMock = {
    getLogger: (name: string) => {
      const aLogger = {
        name,
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
        debug: jest.fn()
      }
      loggers.push(aLogger)
      return aLogger
    }
  }
  serverMock = {
    use: jest.fn().mockImplementation(middleware => (storedMiddleware = middleware)),
    setContext: jest.fn()
  }
  mockedContext = {
    request: {
      method: 'GET',
      url: 'http://localhost/some-endpoint'
    } as IHttpServerComponent.DefaultContext<object>['request'],
    url: new URL('http://localhost/some-endpoint')
  }
  mockedResponse = {
    headers: {
      aHeader: 'aValue'
    }
  }
  mockedNext = jest.fn().mockResolvedValue(mockedResponse)
})

let response: IHttpServerComponent.IResponse

describe('when initializing the component', () => {
  beforeEach(() => {
    createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
  })

  it('should instantiate the output and the input loggers', () => {
    expect(loggers[0]?.name).toEqual('http-in')
    expect(loggers[1]?.name).toEqual('http-out')
  })
})

describe('when the verbosity configuration is set', () => {
  beforeEach(async () => {
    options.verbosity = Verbosity.DEBUG
    createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
    response = await storedMiddleware(mockedContext, mockedNext)
  })

  it('should log the requests using the verbosity', () => {
    expect(loggers[0]?.debug).toHaveBeenCalled()
    expect(loggers[1]?.debug).toHaveBeenCalled()
  })

  it('should resolve the request by continuing with the middleware execution chain', () => {
    expect(mockedNext).toHaveBeenCalled()
    expect(response).toEqual(mockedResponse)
  })
})

describe('when the verbosity configuration is not set', () => {
  beforeEach(async () => {
    options.verbosity = undefined
    createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
    response = await storedMiddleware(mockedContext, mockedNext)
  })

  it('should log the requests using INFO as the default verbosity', () => {
    expect(loggers[0]?.info).toHaveBeenCalled()
    expect(loggers[1]?.info).toHaveBeenCalled()
  })

  it('should resolve the request by continuing with the middleware execution chain', () => {
    expect(mockedNext).toHaveBeenCalled()
    expect(response).toEqual(mockedResponse)
  })
})

describe('when the skip output configuration is set', () => {
  describe('and is set to true', () => {
    beforeEach(async () => {
      options.skipOutput = true
      createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
      response = await storedMiddleware(mockedContext, mockedNext)
    })

    it('should log the request output and log the request input', () => {
      expect(loggers[0]?.info).toHaveBeenCalled()
      expect(loggers[1]?.info).not.toHaveBeenCalled()
    })

    it('should resolve the request by continuing with the middleware execution chain', () => {
      expect(mockedNext).toHaveBeenCalled()
      expect(response).toEqual(mockedResponse)
    })
  })

  describe('and is set to false', () => {
    beforeEach(async () => {
      options.skipOutput = false
      createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
      response = await storedMiddleware(mockedContext, mockedNext)
    })

    it("should log both the request's input and output", () => {
      expect(loggers[0]?.info).toHaveBeenCalled()
      expect(loggers[1]?.info).toHaveBeenCalled()
    })

    it('should resolve the request by continuing with the middleware execution chain', () => {
      expect(mockedNext).toHaveBeenCalled()
      expect(response).toEqual(mockedResponse)
    })
  })
})

describe('when the skip output configuration is not set', () => {
  beforeEach(async () => {
    options.skipOutput = undefined
    createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
    response = await storedMiddleware(mockedContext, mockedNext)
  })

  it("should log both the request's input and output", () => {
    expect(loggers[0]?.info).toHaveBeenCalled()
    expect(loggers[1]?.info).toHaveBeenCalled()
  })

  it('should resolve the request by continuing with the middleware execution chain', () => {
    expect(mockedNext).toHaveBeenCalled()
    expect(response).toEqual(mockedResponse)
  })
})

describe('when the skip input configuration is set', () => {
  describe('and is set to true', () => {
    beforeEach(async () => {
      options.skipInput = true
      createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
      response = await storedMiddleware(mockedContext, mockedNext)
    })

    it('should not log the request input and log the request output', () => {
      expect(loggers[0]?.info).not.toHaveBeenCalled()
      expect(loggers[1]?.info).toHaveBeenCalled()
    })

    it('should resolve the request by continuing with the middleware execution chain', () => {
      expect(mockedNext).toHaveBeenCalled()
      expect(response).toEqual(mockedResponse)
    })
  })

  describe('and is set to false', () => {
    beforeEach(async () => {
      options.skipInput = false
      createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
      response = await storedMiddleware(mockedContext, mockedNext)
    })

    it("should log both the request's input and output", () => {
      expect(loggers[0]?.info).toHaveBeenCalled()
      expect(loggers[1]?.info).toHaveBeenCalled()
    })

    it('should resolve the request by continuing with the middleware execution chain', () => {
      expect(mockedNext).toHaveBeenCalled()
      expect(response).toEqual(mockedResponse)
    })
  })
})

describe('when the skip input configuration is not set', () => {
  beforeEach(async () => {
    options.skipInput = undefined
    createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
    response = await storedMiddleware(mockedContext, mockedNext)
  })

  it("should log both the request's input and output", () => {
    expect(loggers[0]?.info).toHaveBeenCalled()
    expect(loggers[1]?.info).toHaveBeenCalled()
  })

  it('should resolve the request by continuing with the middleware execution chain', () => {
    expect(mockedNext).toHaveBeenCalled()
    expect(response).toEqual(mockedResponse)
  })
})

describe('when the skip parameter is set', () => {
  beforeEach(() => {
    options.skip = '/v1/endpoint'
    createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
  })

  describe('and the log should be skipped', () => {
    beforeEach(async () => {
      mockedContext.url = new URL('http://localhost/v1/endpoint')
      response = await storedMiddleware(mockedContext, mockedNext)
    })

    it('should not log the requests', () => {
      expect(loggers[0]?.info).not.toHaveBeenCalled()
      expect(loggers[1]?.info).not.toHaveBeenCalled()
    })

    it('should resolve the request by continuing with the middleware execution chain', () => {
      expect(mockedNext).toHaveBeenCalled()
      expect(response).toEqual(mockedResponse)
    })
  })

  describe('and the log should not be skipped', () => {
    beforeEach(async () => {
      mockedContext.url = new URL('http://localhost/v1/another-endpoint')
      response = await storedMiddleware(mockedContext, mockedNext)
    })

    it('should log the requests', () => {
      expect(loggers[0]?.info).toHaveBeenCalled()
      expect(loggers[1]?.info).toHaveBeenCalled()
    })

    it('should resolve the request by continuing with the middleware execution chain', () => {
      expect(mockedNext).toHaveBeenCalled()
      expect(response).toEqual(mockedResponse)
    })
  })
})

describe('when the skip parameter is not set', () => {
  beforeEach(async () => {
    options.skip = undefined
    mockedContext.request.url = 'http://localhost/health/live'
    mockedContext.url = new URL('http://localhost/health/live')
    createHttRequestsLogger({ server: serverMock, logger: loggerMock }, options)
    response = await storedMiddleware(mockedContext, mockedNext)
  })

  it('should not log the health requests', () => {
    expect(loggers[0]?.info).not.toHaveBeenCalled()
    expect(loggers[1]?.info).not.toHaveBeenCalled()
  })

  it('should resolve the request by continuing with the middleware execution chain', () => {
    expect(mockedNext).toHaveBeenCalled()
    expect(response).toEqual(mockedResponse)
  })
})