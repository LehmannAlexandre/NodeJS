// Math.floor(Math.random() * 1000000 ) + "" + (+new Date())           ==> nb aléatoire utilisé pour l'id

//pour supprimer un element de mongoose db.utilisateur.remove({pseudo : 'bob'})
// Inclusion de Mongoose
var mongoose = require('mongoose');
var url = require("url");
var util = require("util");

// On se connecte à la base de données
mongoose.connect('mongodb://127.0.0.1:27017/test', function(err) {
	if (err) { console.log(err);}
});

// Création du schéma pour les utilisateur
var utilisateurSchema = mongoose.Schema({
  pseudo : { type : String, match: /^[a-zA-Z0-9-_]/, unique : true },
  MDP : { type : String, match: /^[a-zA-Z0-9-_]/ },
  info : { type : String, default : "Aucun statut" }, 
  amis : [{ type : mongoose.Schema.Types.ObjectId, ref : 'utilisateur'}],
  ID : { type : String, match: /[0-9]/, default : '0'},
  date_last_move : { type : Number , default : 0}
});
 
// Création du Model pour les utilisateur
var utilisateurModel = mongoose.model('utilisateur', utilisateurSchema);	
var router = {};

exports.run_req = function(req, resp) {
	var r = new request(req, resp);
	r.run();
	delete r;
};

var request = function(req, resp) {
	this.req = req;
	this.resp = resp;
	this.msg = "";

	var u = url.parse(req.url, true, true);
	this.path = u.pathname;
	this.query = u.query;
};

request.prototype = {

run:
	function() {
		this.routing();
	},

routing:
	function() {
		if(this.path == "/register") { 													// Appel : http://127.0.0.1:1337/register?id=bobby&mdp=tutu
			this.register(this.query.id, this.query.mdp);
		} else if(this.path == "/deleter") {											// Appel : http://127.0.0.1:1337/deleter?id=bobby&tmpid=123456	
			this.RemoveToDB(this.query.id, this.query.tmpid);
		} else if(this.path == "/login") {												// Appel : http://127.0.0.1:1337/login?id=bobby&mdp=tutu	
			this.login(this.query.id, this.query.mdp);
		} else if(this.path == "/logout") {												// Appel : http://127.0.0.1:1337/logout?id=bobby&tmpid=123456
			this.logout(this.query.id, this.query.tmpid);
		} else if(this.path == "/set_info") {											// Appel : http://127.0.0.1:1337/set_info?id=bobby&tmpid=123456&statut=yeah
			this.set_info(this.query.id, this.query.tmpid, this.query.statut); 
		} else if(this.path == "/get_info") {											// Appel : http://127.0.0.1:1337/get_info?id=bobby
			this.get_info(this.query.id);
		} else if(this.path == "/get_friends") {										// Appel : http://127.0.0.1:1337/get_friends?id=bobby&tmpid=123456789&statut=yeah
			this.get_friends(this.query.id, this.query.tmpid);
		} else if(this.path == "/add_friend") {											// Appel : http://127.0.0.1:1337/add_friend?id=bobby&tmpid=123456789&amiid=bobbyy
			this.add_friend(this.query.id, this.query.tmpid, this.query.amisid);
		} else if(this.path == "/delete_friend") {										// Appel : http://127.0.0.1:1337/delete_friend?id=bobby&tmpid=123456789&amiid=bobbyy	
			this.delete_friend(this.query.id, this.query.tmpid, this.query.amisid);
		} else {
			this.not_found();
		}
	},
	

not_found:
	function() {
		this.msg = "Function not found !";
		this.send_res();
	},


register:
	function(id, mdp) {
		var re = new RegExp("^[a-zA-Z0-9]+$", "g");
		var re2 = new RegExp("^[a-zA-Z0-9]+$", "g");
		if(!re.test(id)){
			this.msg = "Pseudo vide ou avec des caracteres speciaux, veuillez recommencer avec des caracteres alphanumeriques.";
			this.send_res();
			return false;
		}else{
			if(!re2.test(mdp)){
				this.msg = "Mot de passe vide ou avec des caracteres speciaux, veuillez recommencer avec des caracteres alphanumeriques.";
				this.send_res();
				return false;
			}else{
				this.addToDB(id, mdp);
				return true;
			}
		}
	},


deleter:
	function(id) {
		return false;
	},


login:
	function (id, mdp){
	console.log("tentative de connection");
	var _this = this;
	// On verifie que le mdp corresponde au pseudo.
	utilisateurModel.findOne({ pseudo : id, MDP : mdp }, function(err,rep){
		if (err) { 
			console.log(err);
			console.log(" Combinaison id et de mot de passe inconnu : "+ id);
			_this.msg = "La combinaison de id : "+ id +" et du mot de passe "+ mdp +" est inconnu.";
			_this.send_res();
		}else {
			if(rep==null)
			{
				console.log(" Combinaison id et de mot de passe inconnu : "+ id);
				_this.msg = "La combinaison de id : "+ id +" et du mot de passe "+ mdp +" est inconnu.";
				_this.send_res();
			}else{
				// Pour les test j'initialise l'ID a 123456.
				utilisateurModel.findOneAndUpdate({ pseudo : id },{ ID : /*Math.floor(Math.random() * 1000000 ) + "" + (+new Date())*/ "123456" , date_last_move : +new Date()}).exec();
				_this.msg = "Bonjour : " +id+" !";
				_this.send_res();
				console.log("     connection reussie : " + rep.pseudo);
			}
		}		
		});
	},
	
logout:
	function (id, tmpid){
	console.log("tentative de deconnection");
	var _this = this;
	// On verifie que le mdp corresponde au pseudo.
	utilisateurModel.findOne({ pseudo : id, ID : tmpid }, function(err,rep){
		if (err) { 
			console.log(err);
			console.log(" Compte non connecté ou id inconnu : "+ id);
			_this.msg = " Compte non connecté ou id inconnu : "+ id;
			_this.send_res();
		}else {
			if(rep==null)
			{
				console.log(" Compte non connecté ou id inconnu : "+ id);
				_this.msg = " Compte non connecté ou id inconnu : "+ id;
				_this.send_res();
			}else{
				utilisateurModel.findOneAndUpdate({ pseudo : id },{ ID : "0" , date_last_move : "0"}).exec();
				_this.msg = "A bientot : " +id+" !";
				_this.send_res();
				console.log("      deconnection reussie " + rep.pseudo);
			}
		}
		});
	},
	
send_res:
	function(msg) {
		this.resp.writeHead(200, {'Content-Type': 'text/plain'});
		this.resp.write("" + this.msg);
		this.resp.end();
	},

set_info:
	function(id, tmpid, statut) {
	var _this = this;
	// On verifie que la personne soit connectée.
	utilisateurModel.findOne({ pseudo : id, ID : tmpid }, function(err,rep){
		if (err) { 
			console.log(err);
			console.log(" Compte non connecte : "+ id);
			_this.msg = "Compte non connecte : "+ id ;
			_this.send_res();
		}else {
			if(rep==null)
			{
				console.log(" Compte non connecte : "+ id);
				_this.msg = "Compte non connecte : "+ id ;
				_this.send_res();
			// Est-elle active depuis 100 secondes ?
			}else if (rep.date_last_move + 360000 < +new Date() ){
				console.log(" Compte deconnecte par inactivite : "+ id);
				_this.msg = "Compte deconnecte par inactivite : "+ id ;
				_this.send_res();
			}else{
				utilisateurModel.findOneAndUpdate({ pseudo : id },{ info : statut , date_last_move : +new Date()}).exec();
				_this.msg = "Statut mis à jour : " +id+" !";
				_this.send_res();
				console.log("Statut mis a jour : " + rep);
			}
		}
		});
	},
	
	
get_info:
	function(id) {
	var _this = this;
	// On trouve la personne.
	utilisateurModel.findOne({ pseudo : id }, function(err,rep){
		if (err) { 
			console.log(err);
			console.log(" Compte non existant : "+ id);
			_this.msg = "Compte non existant : "+ id ;
			_this.send_res();
		}else {
			if(rep==null)
			{
				console.log(" Compte non existant : "+ id);
				_this.msg = "Compte non existant : "+ id ;
				_this.send_res();
			}else{
				_this.msg = "Statut de : "+ id +" : " +rep.info;
				_this.send_res();
				console.log("Statut de : "+ id +" : " +rep.info);
			}
		}
		});
	},
	
addToDB:
	function (id, mdp){
	var _this = this;
	// On crée une instance du Model
	var monUtilisateur = new utilisateurModel({ pseudo : id });
	monUtilisateur.MDP = mdp;
	// On le sauvegarde dans MongoDB !
	monUtilisateur.save(function (err) {
		if (err) { 
			console.log(err);
			console.log(' echec !' + _this.msg);
			_this.msg = "L'utilisateur : "+ id +" est deja pris, veuillez changer de pseudo";
		}else {
			console.log(' ajoute avec succes !' + _this.msg);
			_this.msg = "L'utilisateur : "+ id +" avec le mot de passe : "+ mdp +" est cree";
		}
		_this.send_res();
		});
	},

RemoveToDB:
	function(id, tmpid) {
	var _this = this;
	console.log("Essaie de suppression");
	// On verifie que la personne soit connectée.
	utilisateurModel.findOne({ pseudo : id, ID : tmpid }, function(err,rep){
		if (err) { 
			console.log(err);
			console.log(" Compte non connecte : "+ id);
			_this.msg = "Compte non connecte : "+ id ;
			_this.send_res();
		}else {
			if(rep==null)
			{
				console.log(" Compte non connecte : "+ id);
				_this.msg = "Compte non connecte : "+ id ;
				_this.send_res();
			// Est-elle active depuis 100 secondes ?
			}else if (rep.date_last_move + 360000 < +new Date() ){
				console.log(" Compte deconnecte par inactivite : "+ id);
				_this.msg = "Compte deconnecte par inactivite : "+ id ;
				_this.send_res();
			}else{
				utilisateurModel.findOneAndRemove({ pseudo : id }).exec();
				_this.msg = "Utilisateur supprime : " +id+" !";
				_this.send_res();
				console.log("Utilisateur supprime : " + id);
			}
		}
		});
	},
	
get_friends :
	function(id, tmpid) {
	var _this = this;
	// On verifie que la personne soit connectée.
	
	//user.findOne({UserName : u]).populate("friends", "username").exec(function(err,req){ 
	
	utilisateurModel.findOne({ pseudo : id, ID : tmpid }, function(err,rep){
		if (err) { 
			console.log(err);
			console.log(" Compte non connecte : "+ id);
			_this.msg = "Compte non connecte : "+ id ;
			_this.send_res();
		}else {
			if(rep==null)
			{
				console.log(" Compte non connecte : "+ id);
				_this.msg = "Compte non connecte : "+ id ;
				_this.send_res();
			// Est-elle active depuis 100 secondes ?
			}else if (rep.date_last_move + 360000 < +new Date() ){
				console.log(" Compte deconnecte par inactivite : "+ id);
				_this.msg = "Compte deconnecte par inactivite : "+ id ;
				_this.send_res();
			}else{
				utilisateurModel.findOneAndUpdate({ pseudo : id },{ date_last_move : +new Date()}).exec();
				
				utilisateurModel.findOne({ pseudo : id})
				.populate("amis")
				.exec(function(err2, rep2){
				
					if(err2) {
						console.log(err2);
					} else {
					
						var rep = [];
						for (var a = 0; a < rep2.amis.length; a++) {
							var b = {
								name: rep2.amis[a].pseudo,
								ip: rep2.amis[a].info
							};
							console.log(util.inspect(b));
							rep.push(b);
						}
						_this.msg = "Liste d'amis : " +JSON.stringify(rep)+" !";
						_this.send_res();
					};
				})
			}
		}
		});
	},
	
add_friend :
	function(id, tmpid, amisid) {
	var _this = this;
	// On verifie que la personne soit connectée.
	utilisateurModel.findOne({ pseudo : id, ID : tmpid }, function(err,rep){
		if (err) { 
			console.log(err);
			console.log(" Compte non connecte : "+ id);
			_this.msg = "Compte non connecte : "+ id ;
			_this.send_res();
		}else {
			if(rep==null)
			{
				console.log(" Compte non connecte : "+ id);
				_this.msg = "Compte non connecte : "+ id ;
				_this.send_res();
			// Est-elle active depuis 100 secondes ?
			}else if (rep.date_last_move + 360000 < +new Date() ){
				console.log(" Compte deconnecte par inactivite : "+ id);
				_this.msg = "Compte deconnecte par inactivite : "+ id ;
				_this.send_res();
			}else{ 
				// *************** EST CE QUE CE COPAIN EXISTE ? *********************
				utilisateurModel.findOne({ pseudo : amisid}, function(err2,rep2){
					if (err2) {
						console.log(err);
						console.log(" Cette personne n'existe pas : "+ amisid);
						_this.msg = " Cette personne n'existe pas : "+ amisid ;
						_this.send_res();
					}else {
						if(rep2==null)
						{
							console.log(" Cette personne n'existe pas : "+ amisid);
							_this.msg = " Cette personne n'existe pas : "+ amisid ;
							_this.send_res();
						}else {
							var added = false;
							var i = 0;
							for(i=0; i<rep.amis.length; i++)
							{
								if(""+rep.amis[i]==""+rep2._id)
								{
									added = true;
								}
							}
							if(added){
								// *************** J'AI DEJA CE COPAIN ! **********************************
									console.log("     Deja present en ami : "+ amisid);
									_this.msg = "     Deja present en ami : "+ amisid ;
									_this.send_res();
							}else{
								// *************** AJOUT D'UN COPAIN ! **********************************
								rep.amis.push(rep2._id);
								rep.save(function (err3){
									if(err3) console.log(err3);
									console.log("     Amis  ajoute : "+ amisid);
									_this.msg = "     Amis  ajoute : "+ amisid ;
									_this.send_res();
								});
							}
						}
					} 
				});
			}
		}
	});
	},
	
delete_friend :
	function(id, tmpid, amisid) {
	var _this = this;
	// On verifie que la personne soit connectée.
	utilisateurModel.findOne({ pseudo : id, ID : tmpid }, function(err,rep){
		if (err) { 
			console.log(err);
			console.log(" Compte non connecte : "+ id);
			_this.msg = "Compte non connecte : "+ id ;
			_this.send_res();
		}else {
			if(rep==null)
			{
				console.log(" Compte non connecte : "+ id);
				_this.msg = "Compte non connecte : "+ id ;
				_this.send_res();
			// Est-elle active depuis 100 secondes ?
			}else if (rep.date_last_move + 360000 < +new Date() ){
				console.log(" Compte deconnecte par inactivite : "+ id);
				_this.msg = "Compte deconnecte par inactivite : "+ id ;
				_this.send_res();
			}else{ 
				// *************** EST CE QUE CE COPAIN EXISTE ? *********************
				utilisateurModel.findOne({ pseudo : amisid}, function(err2,rep2){
					if (err2) {
						console.log(err);
						console.log(" Cette personne n'existe pas : "+ amisid);
						_this.msg = " Cette personne n'existe pas : "+ amisid ;
						_this.send_res();
					}else {
						if(rep2==null)
						{
							console.log(" Cette personne n'existe pas : "+ amisid);
							_this.msg = " Cette personne n'existe pas : "+ amisid ;
							_this.send_res();
						}else {
							var added = false;
							var i = 0, num=0;
							for(i=0; i<rep.amis.length; i++)
							{
								if(""+rep.amis[i]==""+rep2._id)
								{
									added = true;
									num = i;
								}
							}
							if(added){
								// *************** SUPPRESSION DU COPAIN ! **********************************
									rep.amis.splice(num, 1);
									rep.save(function (err3){
									if(err3) console.log(err3);
										console.log("     Amis  supprime : "+ amisid);
										_this.msg = "     Amis  supprime : "+ amisid ;
										_this.send_res();
									});
							}else{
								// *************** JE NE CONNAIS PAS CE COPAIN ! **********************************
									console.log("     N'est pas present dans la liste d'ami : "+ amisid);
									_this.msg = "     N'est pas present dans la liste d'ami : "+ amisid ;
									_this.send_res();
							}
						}
					} 
				});
			}
		}
	});
	}	

	
};