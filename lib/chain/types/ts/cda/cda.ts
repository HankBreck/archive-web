/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "archive.cda";

export interface CDA {
  creator: string;
  id: Long;
  cid: string;
  ownership: Ownership[];
  expiration: Long;
}

export interface Ownership {
  owner: string;
  ownership: Long;
}

function createBaseCDA(): CDA {
  return { creator: "", id: Long.UZERO, cid: "", ownership: [], expiration: Long.UZERO };
}

export const CDA = {
  encode(message: CDA, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.creator !== "") {
      writer.uint32(10).string(message.creator);
    }
    if (!message.id.isZero()) {
      writer.uint32(16).uint64(message.id);
    }
    if (message.cid !== "") {
      writer.uint32(26).string(message.cid);
    }
    for (const v of message.ownership) {
      Ownership.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    if (!message.expiration.isZero()) {
      writer.uint32(40).uint64(message.expiration);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CDA {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCDA();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.creator = reader.string();
          break;
        case 2:
          message.id = reader.uint64() as Long;
          break;
        case 3:
          message.cid = reader.string();
          break;
        case 4:
          message.ownership.push(Ownership.decode(reader, reader.uint32()));
          break;
        case 5:
          message.expiration = reader.uint64() as Long;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): CDA {
    return {
      creator: isSet(object.creator) ? String(object.creator) : "",
      id: isSet(object.id) ? Long.fromValue(object.id) : Long.UZERO,
      cid: isSet(object.cid) ? String(object.cid) : "",
      ownership: Array.isArray(object?.ownership) ? object.ownership.map((e: any) => Ownership.fromJSON(e)) : [],
      expiration: isSet(object.expiration) ? Long.fromValue(object.expiration) : Long.UZERO,
    };
  },

  toJSON(message: CDA): unknown {
    const obj: any = {};
    message.creator !== undefined && (obj.creator = message.creator);
    message.id !== undefined && (obj.id = (message.id || Long.UZERO).toString());
    message.cid !== undefined && (obj.cid = message.cid);
    if (message.ownership) {
      obj.ownership = message.ownership.map((e) => e ? Ownership.toJSON(e) : undefined);
    } else {
      obj.ownership = [];
    }
    message.expiration !== undefined && (obj.expiration = (message.expiration || Long.UZERO).toString());
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<CDA>, I>>(object: I): CDA {
    const message = createBaseCDA();
    message.creator = object.creator ?? "";
    message.id = (object.id !== undefined && object.id !== null) ? Long.fromValue(object.id) : Long.UZERO;
    message.cid = object.cid ?? "";
    message.ownership = object.ownership?.map((e) => Ownership.fromPartial(e)) || [];
    message.expiration = (object.expiration !== undefined && object.expiration !== null)
      ? Long.fromValue(object.expiration)
      : Long.UZERO;
    return message;
  },
};

function createBaseOwnership(): Ownership {
  return { owner: "", ownership: Long.UZERO };
}

export const Ownership = {
  encode(message: Ownership, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.owner !== "") {
      writer.uint32(10).string(message.owner);
    }
    if (!message.ownership.isZero()) {
      writer.uint32(16).uint64(message.ownership);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Ownership {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOwnership();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.owner = reader.string();
          break;
        case 2:
          message.ownership = reader.uint64() as Long;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Ownership {
    return {
      owner: isSet(object.owner) ? String(object.owner) : "",
      ownership: isSet(object.ownership) ? Long.fromValue(object.ownership) : Long.UZERO,
    };
  },

  toJSON(message: Ownership): unknown {
    const obj: any = {};
    message.owner !== undefined && (obj.owner = message.owner);
    message.ownership !== undefined && (obj.ownership = (message.ownership || Long.UZERO).toString());
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Ownership>, I>>(object: I): Ownership {
    const message = createBaseOwnership();
    message.owner = object.owner ?? "";
    message.ownership = (object.ownership !== undefined && object.ownership !== null)
      ? Long.fromValue(object.ownership)
      : Long.UZERO;
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Long ? string | number | Long : T extends Array<infer U> ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
