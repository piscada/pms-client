import { PMSConnector } from './MedoozeConnector'

interface Subscriber {
  func: (...args: PMSConnector[]) => void
  token: string
}

interface Topics {
  [topic: string]: Subscriber[]
}

interface Yaps {
  subscribe: (topic: string, func: (...args: PMSConnector[]) => void) => string
  unsubscribe: (token: string) => Yaps
  publish: (topic: string, ...rest: PMSConnector[]) => Yaps
}

const yapsInstance: Yaps = (function (): Yaps {
  const yaps: Yaps = {} as Yaps
  const topics: Topics = {}
  let subscriberIdentifier = -1

  yaps.subscribe = (
    topic: string,
    func: (...args: PMSConnector[]) => void
  ): string => {
    if (!topics[topic]) {
      topics[topic] = []
    }

    const token = (++subscriberIdentifier).toString()
    topics[topic].push({
      func,
      token
    })

    return token
  }

  yaps.unsubscribe = (token: string): Yaps => {
    for (const topic in topics) {
      if (topics[topic]) {
        topics[topic].forEach((subscriber, index) => {
          if (subscriber.token === token) {
            topics[topic].splice(index, 1)
          }
        })
      }
    }

    return yaps
  }

  yaps.publish = (topic: string, ...rest: PMSConnector[]): Yaps => {
    if (!topics[topic]) {
      return yaps
    }

    const subscribers = topics[topic]

    subscribers.forEach((subscriber) => {
      subscriber.func(...rest)
    })

    return yaps
  }

  return yaps
})()

export const yapsInst: Yaps = yapsInstance

export default yapsInst
