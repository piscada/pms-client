export interface PmsCameraItem {
  id: string;
  type: string;
  url: string;
  state: string;
  viewers: number;
  recordings: number;
  stats: null;
  ports: null;
  remoteAddress: null;
}

interface InstanceId {
  id: string;
}

export const fetchAllCamerasWithInstances = async (api: string, token: string): Promise<PmsCameraItem[]> => {
  // Fetch all instances first
  const arr = await fetch(api + `/instances/`, {
    headers: {
      Authorization: 'bearer ' + token,
    },
  });

  const list: InstanceId[] = await arr.json();

  const instanceIDs = list.map((el: { id: string }) => el.id);

  const res = await Promise.all(
    instanceIDs.map(async (id) => {
      const response = await fetch(api + `/instances/${id}/cameras`, {
        headers: {
          Authorization: 'bearer ' + token,
        },
      });

      const camerasFromInstance = await response.json();

      console.log({ camerasFromInstance });

      return camerasFromInstance;
    }),
  );

  return res[0]; // REMOVE ME
};
