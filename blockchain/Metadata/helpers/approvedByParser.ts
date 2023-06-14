export function parseOutputApproval(approval: any[]) {
  const data = approval.map((m) => {
    return {
      uri: m[0],
      doc: m[1],
      approvedAt: m[2],
    };
  });
  console.log(data);
  return data;
}
