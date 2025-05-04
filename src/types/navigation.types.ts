import { Group } from './group.types';
import { Expense } from './expense.types';

export type GroupStackParamList = {
  GroupList: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  GroupDetails: {
    groupId: string;
  };
  EditGroup: {
    group: Group;
  };
  AddMember: {
    groupId: string;
  };
  GroupSettings: {
    groupId: string;
  };
  CreateExpense: {
    groupId: string;
  };
  ExpenseDetails: {
    groupId: string;
    expenseId: string;
  };
  EditExpense: {
    groupId: string;
    expense: Expense;
  };
}; 