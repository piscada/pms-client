import { TypedEmitter as EventEmitter } from 'tiny-typed-emitter'

// WIRE PROTOCOL

type CommandWireMessage = {
  type: 'cmd'
  namespace?: string
  name: string
  data: unknown
  transId: number
}

type ResponseWireMessage = {
  type: 'error' | 'response'
  data: unknown
  transId: number
}

type EventWireMessage = {
  type: 'event'
  namespace?: string
  name: string
  data: unknown
}

type WireMessage = CommandWireMessage | ResponseWireMessage | EventWireMessage

// USER TYPE BOUNDS

type CommandAcceptRejectFn = (data: never) => void

type Command<T = unknown> = {
  namespace?: string
  name: string
  data: T
  accept: CommandAcceptRejectFn
  reject: CommandAcceptRejectFn
}

type Event<T = unknown> = {
  namespace?: string
  name: string
  data: T
}

type UnknownCommand = Command<unknown>

type AllowedMessagesDirection = {
  cmd: UnknownCommand
  event: Event
}

type AllowedMessages = {
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
  resolve: (data: unknown) => void
  reject: (data: unknown) => void
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

type Transport = { send(data: string): void } & (
  | {
      addEventListener: TransportEventMethod
      removeEventListener: TransportEventMethod
    }
  | { addListener: TransportEventMethod; removeListener: TransportEventMethod }
)

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
        message = JSON.parse(msg as string) //msg.utf8Data || msg.data || msg
      } catch (e) {
        return
      }

      switch (message.type) {
        case 'cmd': {
          const { transId } = message
          const cmd: Command = {
            name: message.name,
            data: message.data,
            namespace: message.namespace,
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

  cmd<N extends string, K extends TMsg['tx']['cmd']['name']>(
    name: K,
    data: (TMsg['tx']['cmd'] & { namespace: N; name: K })['data'],
    namespace?: N
  ): Promise<
    Parameters<(TMsg['tx']['cmd'] & { namespace: N; name: K })['accept']>[0]
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

  namespace<N extends string>(ns: N): Namespace<N, TMsg> {
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
