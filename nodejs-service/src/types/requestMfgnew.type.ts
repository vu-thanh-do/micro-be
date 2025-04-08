interface Line {
    id: string;
    name: string;
    dailyVolume: number;
    standardPerson: number;
    actualEmployeeNumber: number;
    requireNumber: number;
    terminate: number;
    pregnantLeave: number;
    leaveAdjustment: number;
    actualComeBack: number;
  }
  
  interface LevelApproval {
    Id: number;
    level: number;
    EmployeeId: string;
    EmployeeName: string;
  }
  
  interface PhysicalCondition {
    height: number;
    weight: number;
  }
  
  interface EnterDate {
    enterDate: string;
    quantity: number;
  }
  
  interface Conclusion {
    total: {
      official: number;
      outsource: number;
      student: number;
    };
    education: string;
    age: string;
    gender: string;
    physicalCondition: {
      male: PhysicalCondition;
      female: PhysicalCondition;
    };
    enterDate: EnterDate[];
  }
  
  interface TotalSummary {
    dailyVolume: number;
    standardPerson: number;
    actualEmployeeNumber: number;
    movement: number;
    terminate: number;
    pregnantLeave: number;
    leaveAdjustment: number;
    requireNumber: number;
    requireNumberForAllLine: number;
    actualComeBack: number;
    remainLastMonth: number;
    totalRequire: number;
  }
  
  interface NameForm {
    title: string;
  }
  
  export interface IMfgRecruitmentRequest {
    lines: Line[];
    movement: number;
    requireNumberAllLine: number;
    remainLastMonth: number;
    totalRequire: number;
    year: number;
    month: number;
    recCode: string;
    userId: string;
    RequesterName: string;
    RequesterCode: string;
    RequesterPosition: string;
    RequesterSection: string;
    formType: string;
    nameForm: NameForm;
    levelApproval: LevelApproval[];
    conclusion: Conclusion;
    total: TotalSummary;
    status: string;
    deptCode: string;
  }
  