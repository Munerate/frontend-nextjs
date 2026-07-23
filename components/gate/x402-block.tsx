type Props = {
  state?: "default" | "unrecognised";
};

export function X402Block({ state = "default" }: Props) {
  if (state === "unrecognised") {
    return (
      <div className="rounded-md border hairline bg-ink-950/60 px-4 py-3 font-mono text-[12px] leading-relaxed text-ink-200">
        <div>
          <span className="text-ink-300">HTTP</span>
          <span className="text-ink-200">/1.1 </span>
          <span className="text-red-400">401</span>
          <span className="text-ink-200"> Unauthorized</span>
        </div>
        <div className="mt-2 text-ink-300">{"{"}</div>
        <div className="pl-4">
          <span className="text-ink-300">&quot;status&quot;</span>
          <span className="text-ink-200">: </span>
          <span className="text-red-400">401</span>
          <span className="text-ink-200">,</span>
        </div>
        <div className="pl-4">
          <span className="text-ink-300">&quot;message&quot;</span>
          <span className="text-ink-200">: </span>
          <span className="text-ink-100">&quot;This email is not on the principals list.&quot;</span>
          <span className="text-ink-200">,</span>
        </div>
        <div className="pl-4">
          <span className="text-ink-300">&quot;to_request_access&quot;</span>
          <span className="text-ink-200">: </span>
          <span className="text-ink-100">&quot;email adam@munerate.com&quot;</span>
        </div>
        <div className="text-ink-300">{"}"}</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border hairline bg-ink-950/60 px-4 py-3 font-mono text-[12px] leading-relaxed text-ink-200">
      <div>
        <span className="text-ink-300">HTTP</span>
        <span className="text-ink-200">/1.1 </span>
        <span className="text-field-b">402</span>
        <span className="text-ink-200"> Payment Required</span>
      </div>
      <div>
        <span className="text-ink-300">WWW-Authenticate</span>
        <span className="text-ink-200">: x402 realm=</span>
        <span className="text-ink-100">&quot;principal&quot;</span>
      </div>
      <div>
        <span className="text-ink-300">Accept-Payment</span>
        <span className="text-ink-200">: email-otp</span>
      </div>
    </div>
  );
}
