export const fetchAllCamerasWithInstances = async (api, token) => {
  // Fetch all instances first
  const arr = await fetch(api + `/instances/`, {
    headers: {
      Authorization: 'bearer ' + token
    }
  })

  const list = await arr.json()

  const instanceIDs = list.map((el) => el.id)

  const res = await Promise.all(
    await instanceIDs.map(async (id) => {
      const response = await fetch(api + `/instances/${id}/cameras`, {
        headers: {
          Authorization: 'bearer ' + token
        }
      })

      const camerasFromInstance = await response.json()

      console.log({ camerasFromInstance })

      return camerasFromInstance
    })
  )

  return res[0] // REMOVE ME
}
