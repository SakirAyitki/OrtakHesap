import { Group } from './group.types';

export type GroupStackParamList = {
  GroupList: undefined;
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
}; 