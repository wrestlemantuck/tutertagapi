using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

public class discordNotifier : MonoBehaviour
{
    public string apiUrl = "https://your-vercel-app.vercel.app/api/notify";

    public void sendmessagetodiscord(string message, string playerId, string sessionTicket)
    {
        StartCoroutine(postmessagecoroutine(message, playerId, sessionTicket));
    }

    private IEnumerator postmessagecoroutine(string message, string playerId, string sessionTicket)
    {
        string jsonPayload = JsonUtility.ToJson(new payload(message, playerId, sessionTicket));

        using (UnityWebRequest request = new UnityWebRequest(apiUrl, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonPayload);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

#if UNITY_2020_1_OR_NEWER
            if (request.result != UnityWebRequest.Result.Success)
#else
            if (request.isNetworkError || request.isHttpError)
#endif
            {
                Debug.LogError($"error sending message: {request.error}");
            }
            else
            {
                Debug.Log($"message sent successfully: {request.downloadHandler.text}");
            }
        }
    }

    [System.Serializable]
    private class payload
    {
        public string message;
        public string playerId;
        public string sessionTicket;

        public payload(string message, string playerId, string sessionTicket)
        {
            this.message = message;
            this.playerId = playerId;
            this.sessionTicket = sessionTicket;
        }
    }
}
