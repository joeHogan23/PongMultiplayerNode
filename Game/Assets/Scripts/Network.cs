using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using SocketIO;
using System;
using UnityEngine.SceneManagement;

public class Network : MonoBehaviour {
    public static SocketIOComponent socket;
    public GameObject playerPrefab;
    static Spawner Spawner;

    public GameObject LocalBall;
    public static bool StartGame { get;  set; }
    public static bool ResettingBoard = false;
    // Use this for initialization
    void Start () {
        Spawner = GetComponent<Spawner>();

        //Instantiate(ball, Vector2.zero, Quaternion.identity);

        socket = GetComponent<SocketIOComponent>();
        socket.On("open", OnConnected);
        socket.On("talkback", OnTalkBack);
        socket.On("spawn", OnSpawn);
        socket.On("move", OnMove);
        socket.On("disconnected", OnDisconnected);
        socket.On("disconnectAll", OnHostDisconnected);


        socket.On("register", OnRegister);
        socket.On("updatePosition", OnUpdatePosition);
        socket.On("requestPosition", OnRequestPosition);
        socket.On("setNetworkPlayerPosition", OnNetworkSpawn);

        socket.On("spawnHostBall", OnSpawnHostBall);
        socket.On("spawnNetworkBall", OnSpawnNetworkBall);
        socket.On("moveNetworkBall", BallMovementNetwork.OnMoveNetworkBall);

        //socket.On("resetHostBall", BallMovement.OnResetBall);

        socket.On("startGame", OnStartGame);
        socket.On("stopGame", OnStopGame);

        socket.On("resetPlayerPosition", OnResetPlayers);
        socket.On("initialize", OnInitialize);
        //socket.On("resetBall", BallMovement.OnResetBall);


        socket.On("playerScored", OnPlayerScored);
        
        //var player = Instantiate(Spawner.localPlayer, Vector2.zero, Quaternion.identity) as GameObject;

        //player.transform.position = new Vector2(7, 0);
    }

    private void OnInitialize(SocketIOEvent obj)
    {
        socket.Emit("initializeAllActors");
    }

    internal static void UpdatePlayerText(string id, int v)
    {
        throw new NotImplementedException();
    }

    void OnStopGame(SocketIOEvent obj)
    {
        StartGame = false;
    }

    void OnStartGame(SocketIOEvent obj)
    {
        Debug.Log("StartingGame");
        StartGame = true;
    }

    void OnResetPlayers(SocketIOEvent obj)
    {
        foreach (KeyValuePair<string, GameObject> player in Spawner.players)

            player.Value.transform.position = new Vector2(player.Value.transform.position.x, 0);
    }

    void OnPlayerScored(SocketIOEvent obj)
    {
        Spawner.ScoreManager.UpdateScore(obj.data["id"].str);
        if (Spawner.ScoreManager.RoundWon(obj.data["id"].str))
        {
            socket.Emit("gameWon",obj.data);
        }

    }

    private static void GameWon(string str)
    {

    }

    private void OnNetworkSpawn(SocketIOEvent obj)
    {
        var id = obj.data["id"].str;

        var player = Spawner.FindPlayer(id);

        player.transform.position = new Vector2(7, 0);
    }

    private void OnSpawnHostBall(SocketIOEvent obj)
    {
        Spawner.SpawnHostBall();
    }

    private void OnSpawnNetworkBall(SocketIOEvent obj)
    {
        Spawner.SpawnNetworkBall();
    }

    //private void OnMoveNetworkBall(SocketIOEvent obj)
    //{
    //    //var v = float.Parse(obj.data["v"].str);
    //    //var h = float.Parse(obj.data["h"].str);

    //    //Debug.Log(v);
    //    //var player = Spawner.FindPlayer(id);
    //    //Debug.Log(player);
    //    //var playerMover = player.GetComponent<PlayerMovementNetwork>();
    //    //playerMover.v = v;
    //    //playerMover.h = h;
    //}

    //private void OnMoveHostBall(SocketIOEvent obj)
    //{
    //    throw new NotImplementedException();
    //}

    private void OnHostDisconnected(SocketIOEvent obj)
    {
        socket.Emit("disconnect");
    }

    private void OnRequestPosition(SocketIOEvent obj)
    {
        socket.Emit("updatePosition", PosToJson(Spawner.localPlayer.transform.position, Spawner.localPlayer.transform.rotation.eulerAngles.z));
    }

    private void OnUpdatePosition(SocketIOEvent obj)
    {
        Debug.Log("Updating positions " + obj.data);

        var position = MakePosfromJson(obj);
        var rotation = obj.data["rotz"].n;
        var player = Spawner.FindPlayer(obj.data["id"].str);

        player.transform.position = position;
        player.transform.eulerAngles = new Vector3(0,0,rotation); 
    }

    private void OnRegister(SocketIOEvent obj)
    {
        Debug.Log("Regisetered Player " + obj.data["id"].str);
        Spawner.AddPlayer(obj.data["id"].ToString(), Spawner.localPlayer);
    }

    private void OnDisconnected(SocketIOEvent obj)
    {
        Debug.Log("Player disconnected " + obj.data);

        var id = obj.data["id"].ToString();

        Spawner.RemovePlayer(id);
    }

    private void OnMove(SocketIOEvent obj)
    {
        //Debug.Log("Player Moving" + obj.data);
        var id = obj.data["id"].ToString();
        Debug.Log(id);

        var v = float.Parse(obj.data["v"].str);
        var h = float.Parse(obj.data["h"].str);

        Debug.Log(v);
        var player = Spawner.FindPlayer(id);
        var playerMover = player.GetComponent<PlayerMovementNetwork>();
        playerMover.v = v;
        playerMover.h = h;
    }

    private void OnSpawn(SocketIOEvent obj)
    {
        Debug.Log("Player Spawned" + obj.data);
        var player = Spawner.SpawnPlayer(obj.data["id"].ToString());
    }

    private void OnTalkBack(SocketIOEvent obj)
    {
        Debug.Log("The Server says Hello Back");
    }

    private void OnConnected(SocketIOEvent obj)
    {
        Debug.Log("Connected to Server");
        socket.Emit("sayhello");
    }

    static public void Move(float currentPosV, float currentPosH)
    {
        socket.Emit("move", new JSONObject(VectorToJson(currentPosV, currentPosH)));
    }

    public static string VectorToJson(float dirV, float dirH)
    {
        return string.Format(@"{{""v"":""{0}"",""h"":""{1}""}}", dirV, dirH);
    }

    public static JSONObject PosToJson(Vector3 pos, float rotz)
    {
        JSONObject jpos = new JSONObject(JSONObject.Type.OBJECT);
        jpos.AddField("x", pos.x);
        jpos.AddField("y", pos.y);
        jpos.AddField("z", pos.z);
        jpos.AddField("rotz", rotz);
        return jpos;
    }

    public static Vector3 MakePosfromJson(SocketIOEvent e)
    {
        return new Vector3(e.data["x"].n, e.data["y"].n, e.data["z"].n);
    }

    public static void MoveHostBall(float x, float y)
    {
        socket.Emit("moveHostBall", new JSONObject(VectorToJson(x, y)));
    }

    public static void Scored(string id)
    {

    }
}
