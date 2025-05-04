import { Group } from './group.types';
import { Expense } from './expense.types';

export type GroupStackParamList = {
  GroupList: undefined;
  GroupDetails: { groupId: string };
  CreateGroup: undefined;
  AddMember: { groupId: string };
  CreateExpense: { groupId: string };
  ExpenseDetails: { expenseId: string; groupId: string };
  EditExpense: { expenseId: string; groupId: string };
  EditGroup: { groupId: string };
  GroupSettings: { groupId: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Groups: undefined;
  Balance: undefined;
  Profile: undefined;
}; 