using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SceneManager : MonoBehaviour {
    [SerializeField] GameObject form;
    [SerializeField] GameObject game;

	// Use this for initialization
	void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
		
	}

    public void PlayGame()
    {
        form.SetActive(false);
        game.SetActive(true);
        Network.socket.Emit("checkReady");
    }
}
