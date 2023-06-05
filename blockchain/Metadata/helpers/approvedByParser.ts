export function parseOutputApproval(approval: any[]) {
  const data = approval.map((m) => {
    return {
      uri: m[0][0],
      approvedAt: m[0][1],
    };
  });
  return data;
}
