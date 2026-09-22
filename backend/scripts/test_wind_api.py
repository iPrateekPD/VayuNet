import httpx
import asyncio

async def test_om():
    lats = "19.0,19.5,20.0"
    lons = "83.0,83.5,84.0"
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lats}&longitude={lons}&current=wind_speed_10m,wind_direction_10m"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        print("Status:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                print(f"Returned list of {len(data)} locations")
                print(data[0]["current"])
            else:
                print("Returned dict (maybe just 1 location?)")
                print(data)
        else:
            print(resp.text)

if __name__ == "__main__":
    asyncio.run(test_om())
