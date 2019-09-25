const PROVIDER = 'http://localhost:7545';

const App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init() {
    return App.initWeb3();
  },

  initWeb3() {
    // If a web3 instance is already provided by Meta Mask.
    App.web3Provider = web3 ? web3.currentProvider : new Web3.providers.HttpProvider(PROVIDER);
    web3 ? window.ethereum.enable() : null;
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract() {
    $.getJSON("Election.json", election => {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      return App.render();
    });
  },
  async render() {
    try {
      const loader = $("#loader");
      const content = $("#content");

      loader.show();
      content.hide();

      App.account = (await web3.eth.getAccounts())[0];
      $("#accountAddress").html(`Your Account: ${App.account}`);

      // Load contract data
      const electionInstance = await App.contracts.Election.deployed()
      const candidateCount = await electionInstance.candidatesCount();
      const candidatesResults = $("#candidatesResults");
      const candidatesSelect = $("#candidatesSelect");

      candidatesSelect.empty();
      candidatesResults.empty();

      // Populate Candidate list
      for (var i = 1; i <= candidateCount; i++) {
        const candidate = await electionInstance.candidates(i)
        const [id, name, voteCount] = candidate;

        candidatesResults.append(`<tr><th>${id}</th><td>${name}</td><td>${voteCount}</td></tr>`);
        candidatesSelect.append(`<option value='${id}'>${name}</option>`);
      }

      const {
        account
      } = App;

      // Ensure the account exists first
      if (account) {
        const hasVoted = await electionInstance.voters(account);
        if (hasVoted) $('form').hide();
      }

      loader.hide();
      content.show();

    } catch (e) {
      console.error(e);
    }

  },
  async castVote() {
    try {

      const candidateId = $('#candidatesSelect').val();
      const instance = await App.contracts.Election.deployed()

      const {
        account
      } = App;
      if (!account) throw new Error('Cannot vote because the current account is not defined');

      const options = {
        from: account
      }

      await instance.vote(candidateId, options);

      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();

    } catch (e) {
      console.error(e)
    }

  }
};

$(() => $(window).load(() => App.init()));