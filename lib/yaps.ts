interface Subscriber {
  func: (...args: any[]) => void
  token: string
}

interface Topics {
  [topic: string]: Subscriber[]
}

interface Yaps {
  subscribe: (topic: string, func: (...args: any[]) => void) => string
  unsubscribe: (token: string) => Yaps
  publish: (topic: string, ...rest: any[]) => Yaps
}

const yapsInstance: Yaps = (function (): Yaps {
  const yaps: Yaps = {} as Yaps
  const topics: Topics = {}
  let subscriberIdentifier = -1

  yaps.subscribe = (topic: string, func: (...args: any[]) => void): string => {
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
      if (topics.hasOwnProperty(topic)) {
        topics[topic].forEach((subscriber, index) => {
          if (subscriber.token === token) {
            topics[topic].splice(index, 1)
          }
        })
      }
    }

    return yaps
  }

  yaps.publish = (topic: string, ...rest: any[]): Yaps => {
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

export const yaps: Yaps = yapsInstance

export default yaps;