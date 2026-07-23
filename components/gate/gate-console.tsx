"use client";

import { useState } from "react";
import { GateForm } from "./gate-form";
import { X402Block } from "./x402-block";

export function GateConsole({ from }: { from?: string }) {
  const [unrecognised, setUnrecognised] = useState(false);

  return (
    <>
      <X402Block state={unrecognised ? "unrecognised" : "default"} />
      <GateForm from={from} onUnrecognisedChange={setUnrecognised} />
    </>
  );
}
