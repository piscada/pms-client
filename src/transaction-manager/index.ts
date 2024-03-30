import { TypedEmitter as EventEmitter } from 'tiny-typed-emitter'

export type UnknownData = string | Date | Array<unknown> | object

type CommandWireMessage = {
  type: 'cmd'
  namespace?: string
  name: string
  data: UnknownData
  transId: number
}

type ResponseWireMessage = {
  type: 'error' | 'response'
  data: UnknownData
  transId: number
}

type EventWireMessage = {
  type: 'event'
  namespace?: string
  name: string
  data: UnknownData
}

type WireMessage = CommandWireMessage | ResponseWireMessage | EventWireMessage

// USER TYPE BOUNDS

type CommandAcceptRejectFn = (data: never) => void

type Command<T = UnknownData> = {
  namespace: string
  name: string
  data: T
  accept: CommandAcceptRejectFn
  reject: CommandAcceptRejectFn
}

export type Event<T = UnknownData> = {
  namespace: string
  name: string
  data: T
}

type UnknownCommand = Command<UnknownData>

export type AllowedMessagesDirection = {
  cmd: UnknownCommand
  event: Event
}

export type AllowedMessages = {
  rx: AllowedMessagesDirection
  tx: AllowedMessagesDirection
}

// API IMPLEMENTATION

type NamespaceEvents<TMsg extends AllowedMessages, N extends string> = {
  cmd: (cmd: TMsg['rx']['cmd'] & { namespace: N }) => void
  event: (event: TMsg['rx']['event'] & { namespace: N }) => void
}

class Namespace<
  N extends string,
  TMsg extends AllowedMessages = {
    rx: { cmd: UnknownCommand; event: Event }
    tx: { cmd: UnknownCommand; event: Event }
  }
> extends EventEmitter<NamespaceEvents<TMsg, N>> {
  constructor(
    public readonly namespace: N,
    public readonly tm: TransactionManager<TMsg>
  ) {
    super()
  }

  cmd<K extends TMsg['tx']['cmd']['name']>(
    name: K,
    data: (TMsg['tx']['cmd'] & { namespace: N; name: K })['data']
  ): Promise<
    Parameters<(TMsg['tx']['cmd'] & { namespace: N; name: K })['accept']>[0]
  > {
    return this.tm.cmd(name, data, this.namespace)
  }

  event<K extends TMsg['tx']['event']['name']>(
    name: K,
    data: (TMsg['tx']['event'] & { namespace: N; name: K })['data']
  ) {
    return this.tm.event(name, data, this.namespace)
  }

  close() {
    return this.tm.namespaces.delete(this.namespace)
  }
}

type Transaction = {
  resolve: (data: UnknownData) => void
  reject: (data: UnknownData) => void
}

type TransactionManagerEvents<TMsg extends AllowedMessages> = {
  cmd: (cmd: TMsg['rx']['cmd']) => void
  event: (event: TMsg['rx']['event']) => void
}

type TransportMessage =
  | { type: 'binary'; binaryData: ArrayBuffer }
  | { type: 'utf8'; utf8Data: string }
  | { data: string | Uint8Array }
  | string
  | Uint8Array

type TransportEventMethod = (
  event: 'message',
  listener: (msg: TransportMessage) => void
) => void

type Transport = { send(data: string): void } & {
  addEventListener?: TransportEventMethod
  removeEventListener?: TransportEventMethod
  // OR
  addListener?: TransportEventMethod
  removeListener?: TransportEventMethod
}

// type N = string

class TransactionManager<
  TMsg extends AllowedMessages = {
    rx: { cmd: UnknownCommand; event: Event }
    tx: { cmd: UnknownCommand; event: Event }
  }
> extends EventEmitter<TransactionManagerEvents<TMsg>> {
  private maxId: number
  public namespaces: Map<string, Namespace<string, TMsg>>
  private transactions: Map<number, Transaction>
  private listener: (msg: TransportMessage) => void
  private transport: Transport

  constructor(transport: Transport) {
    super()
    this.maxId = 0
    this.namespaces = new Map()
    this.transactions = new Map()
    this.transport = transport

    this.listener = (msg) => {
      let message: WireMessage

      //   CommandWireMessage | ResponseWireMessage | EventWireMessage

      try {
        message = this.messageParser(msg)
      } catch (e) {
        return
      }
      switch (message.type) {
        case 'cmd': {
          const { transId } = message
          const cmd: Command = {
            name: message.name,
            data: message.data,
            namespace: message?.namespace,
            accept: (data) => {
              this._send({
                type: 'response',
                transId: transId,
                data: data
              })
            },
            reject: (data) => {
              this._send({
                type: 'error',
                transId: transId,
                data: data
              })
            }
          }

          if (cmd.namespace) {
            const namespace = this.namespaces.get(cmd.namespace)
            if (namespace) namespace.emit('cmd', cmd)
            else this.emit('cmd', cmd)
          } else {
            this.emit('cmd', cmd)
          }
          break
        }

        case 'response': {
          const transaction = this.transactions.get(message.transId)
          if (!transaction) return
          this.transactions.delete(message.transId)
          transaction.resolve(message.data)
          break
        }

        case 'error': {
          const transaction = this.transactions.get(message.transId)
          if (!transaction) return
          this.transactions.delete(message.transId)
          transaction.reject(message.data)
          break
        }

        case 'event': {
          const event: Event = {
            name: message.name,
            data: message.data,
            namespace: message.namespace
          }
          if (event.namespace) {
            const namespace = this.namespaces.get(event.namespace)
            if (namespace) namespace.emit('event', event)
            else this.emit('event', event)
          } else {
            this.emit('event', event)
          }
          break
        }
      }
    }

    this.transport.addListener
      ? this.transport.addListener('message', this.listener)
      : this.transport.addEventListener('message', this.listener)
  }

  protected _send(msg: WireMessage) {
    this.transport.send(JSON.stringify(msg))
  }

  protected messageParser(msg: TransportMessage): WireMessage {

    // ORIGINAL parser is:
    // message = JSON.parse(msg.utf8Data || msg.data || msg)

    // Trying with typescript.
    // Note: 1. the commented out lines cannot be parsed. 
    // Check for future fixes or ask Sergio if they are used accordingly.
    // https://github.com/medooze/transaction-manager

    if (typeof msg === 'string') return JSON.parse(msg)
    // if ('data' in msg) return JSON.parse(msg.data)
    if ('utf8Data' in msg) return JSON.parse(msg.utf8Data)
    // if ('binaryData' in msg) return JSON.parse(msg.binaryData.toString())
    throw new Error('Bad message')
  }

  cmd<N extends string, K extends TMsg['tx']['cmd']['name']>(
    name: K,
    data: (TMsg['tx']['cmd'] & { namespace?: N; name: K })['data'],
    namespace?: N
  ): Promise<
    Parameters<(TMsg['tx']['cmd'] & { namespace?: N; name: K })['accept']>[0]
  > {
    return new Promise((resolve, reject) => {
      if (!name || name.length === 0) throw new Error('Bad command name')

      const cmd: CommandWireMessage = {
        type: 'cmd',
        transId: this.maxId++,
        name: name,
        data: data
      }

      if (namespace) cmd.namespace = namespace

      this.transactions.set(cmd.transId, { ...cmd, resolve, reject })

      try {
        this._send(cmd)
      } catch (e) {
        this.transactions.delete(cmd.transId)
        throw e
      }
    })
  }

  event<N extends string, K extends TMsg['tx']['event']['name']>(
    name: K,
    data: (TMsg['tx']['event'] & { namespace: N; name: K })['data'],
    namespace?: N
  ) {
    if (!name || name.length === 0) throw new Error('Bad event name')

    const event: EventWireMessage = {
      type: 'event',
      name: name,
      data: data
    }

    if (namespace) event.namespace = namespace

    this._send(event)
  }

  namespace(ns: string): Namespace<string, TMsg> {
    let namespace = this.namespaces.get(ns)
    if (namespace) return namespace
    namespace = new Namespace(ns, this)
    this.namespaces.set(ns, namespace)
    return namespace
  }

  close() {
    for (const ns of this.namespaces.values()) ns.close()
    this.transport.removeListener
      ? this.transport.removeListener('message', this.listener)
      : this.transport.removeEventListener('message', this.listener)
  }
}

export { TransactionManager, Namespace }
