import { LOCAL_ERROR_CODE } from "@zeyn/local-host/protocol";

import { LOCAL_CLIENT_ERROR } from "./useLocalGame";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface LocalErrorCopy {
  message: string;
  hints: string[];
}

export function localErrorCopy(t: Translate, code: string | null): LocalErrorCopy {
  const networkHints = [
    t("local.errors.sameWifiHint"),
    t("local.errors.apIsolationHint"),
  ];

  switch (code) {
    case LOCAL_ERROR_CODE.BAD_NONCE:
      return { message: t("local.errors.wrongCode"), hints: [] };

    case LOCAL_ERROR_CODE.THROTTLED:
      return { message: t("local.errors.throttled"), hints: [] };

    case LOCAL_ERROR_CODE.BAD_HELLO:
    case LOCAL_ERROR_CODE.HELLO_TIMEOUT:
      return { message: t("local.errors.handshake"), hints: networkHints };

    case LOCAL_CLIENT_ERROR.ROOM_FULL:
      return { message: t("local.errors.roomFull"), hints: [] };

    case LOCAL_CLIENT_ERROR.CONNECTION_LOST:
      return { message: t("local.errors.lost"), hints: networkHints };

    case "ALREADY_FINISHED":
      return { message: t("local.errors.finished"), hints: [] };

    case "ALREADY_STARTED":
      return { message: t("local.errors.started"), hints: [] };

    default:
      return { message: t("local.errors.timeout"), hints: networkHints };
  }
}
