import { EventEmitter } from "node:events";

type EventHandler<TPayload> = (payload: TPayload) => void;

export class EventBus {
  private readonly emitter = new EventEmitter();

  emit<TPayload>(eventName: string, payload: TPayload): void {
    this.emitter.emit(eventName, payload);
  }

  on<TPayload>(eventName: string, handler: EventHandler<TPayload>): () => void {
    this.emitter.on(eventName, handler);

    return () => {
      this.emitter.off(eventName, handler);
    };
  }

  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}
