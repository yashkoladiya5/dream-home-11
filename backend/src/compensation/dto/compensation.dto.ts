export class QueryCompensationsDto {
  page?: number;
  limit?: number;
  status?: string;
}

export class CompensateContestDto {
  contestId: string;
}
