export interface IRosSocket {
    connect(): void;
    disconnect(): void;
    close(): void;
    end(): void;
}
