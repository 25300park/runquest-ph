const joinedGroupsStorageKey = 'runquest-ph-joined-groups';

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function getJoinedGroupIds() {
  if (!hasStorage()) {
    return [];
  }

  const storedGroups = window.localStorage.getItem(joinedGroupsStorageKey);

  return storedGroups ? (JSON.parse(storedGroups) as string[]) : [];
}

export function toggleJoinedGroup(groupId: string) {
  if (!hasStorage()) {
    return [];
  }

  const currentGroups = getJoinedGroupIds();
  const nextGroups = currentGroups.includes(groupId)
    ? currentGroups.filter((id) => id !== groupId)
    : [...currentGroups, groupId];

  window.localStorage.setItem(joinedGroupsStorageKey, JSON.stringify(nextGroups));

  return nextGroups;
}
