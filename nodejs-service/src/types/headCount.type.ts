export interface IDataHeadCount {
  ID: number;
  DepartmentID: number;
  FiscalYear: number;
  QuaterID: number | null;
  HCPlan: number;
  Month: number;
  DIID: number;
  Actual: number;
  Diff: number;
  DivisionID: number;
}
export interface INameDep {
    ID: number;
    Code: string,
    Name: string,
  }