using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using SocketIO;
using System;
using UnityEngine.UI;

public class Spawner : MonoBehaviour {
    public GameObject localPlayer;
    public GameObject playerPrefab;

    [SerializeField] GameObject ballHost;
    [SerializeField] GameObject ballNetwork;

    public ScoreManager ScoreManager;
    [SerializeField] GameObject textPrefab;

    internal GameObject LocalBall;

    public SocketIOComponent socket;

    public Dictionary<string, GameObject> players = new Dictionary<string, GameObject>();

    public GameObject SpawnPlayer(string id) {
        var player = Instantiate(playerPrefab, new Vector2(7, 0), Quaternion.identity) as GameObject;

        Debug.Log("Plyer spawned");
        id = id.Replace("\"", "");
        player.GetComponent<NetworkEntity>().id = id;
        AddPlayer(id, player);
        return player;
    }

    public void AddPlayer(string id, GameObject player)
    {
        Debug.Log(id);
        id = id.Replace("\"", "");
        players.Add(id, player);
        AddScoreGameObject(id, Instantiate(textPrefab, Vector2.zero, 
            Quaternion.identity, ScoreManager.parent.transform));
    }

    public void AddScoreGameObject(string id, GameObject text)
    {

        text.transform.position = Camera.main.WorldToScreenPoint((Vector2)players[id].transform.position + 
            new Vector2(players[id].transform.position.x > 0 ? -3 : 3, 0)); ;
        text.GetComponent<NetworkEntity>().id = id;
        ScoreManager.scoreTexts.Add(id, text);
        ScoreManager.scores.Add(id, new int());
    }

    public GameObject FindPlayer(string id)
    {
        id = id.Replace("\"", "");
        return players[id];
    }

    public void RemovePlayer(string id)
    {
        id = id.Replace("\"", "");
        var player = players[id];

        Destroy(player);
        players.Remove(id);
    }

    internal void SpawnHostBall()
    {
        LocalBall = Instantiate(ballHost, Vector3.zero, Quaternion.identity);
    }

    public void SpawnNetworkBall()
    {
        LocalBall = Instantiate(ballNetwork, Vector3.zero, Quaternion.identity);
    }
}
