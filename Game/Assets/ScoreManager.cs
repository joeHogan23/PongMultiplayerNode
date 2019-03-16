using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class ScoreManager : MonoBehaviour {

    public GameObject parent;

    [SerializeField] int pointsToWin = 5;

    public Dictionary<string, GameObject> scoreTexts = new Dictionary<string, GameObject>();
    public Dictionary<string, int> scores = new Dictionary<string, int>();

    public void UpdateScore(string id)
    {
        //if (!Network.ResettingBoard)
        //{
            Debug.Log("Updating Score");
            id = id.Replace("\"", "");
        
            scoreTexts[id].GetComponent<Text>().text = (scores[id]++).ToString();

            Network.ResettingBoard = true;
        //}
        Network.socket.Emit("resetRound");
    }
    public bool RoundWon(string id)
    {
        if (scores[id] >= pointsToWin)
            return true;
        return false;
    }
}
