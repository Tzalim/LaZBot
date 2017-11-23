let Module          = require('../module.js');

class Command extends Module {

    constructor(clientConfig, moduleConfig, message) {
        
        super(clientConfig, moduleConfig, message);
       
    }
    
    process() {
                
        try {
            
            /** Sanitize message content */
            const content = this.message.content.replace(`${this.clientConfig.prefix}${this.moduleConfig.command}`,'').trim();
            if( content === "help" || content.length === 0 )   { return this.help(); }
            if( content === "status" ) { return this.status(); }
    
            /** Check permissions first */
        	if( !this.message.member.roles.find("name", this.clientConfig.adminRole) && this.message.author.id !== this.clientConfig.master ) {			
        		this.message.react(this.clientConfig.reaction.DENIED);
        		return;
    		}
        	                        
            const messageParts = content.split(/\s+/g);
            if( messageParts.length !== 1 ) { return this.help(); }

            let toggle = ["on","true","monitor","activate"].includes(messageParts[0].trim()) ? true : false;
        	
            //CHECK THAT BOT HAS PERMISSIONS TO REMOVE POSTS BEFORE ACTIVATING
            let bot = this.message.channel.members.filter(m => m.id === this.clientConfig.client.user.id).first().permissionsIn(this.message.channel.id);
        	if( !bot.has("MANAGE_MESSAGES") ) { 
        	
        	    this.message.react(`${this.moduleConfig.reaction.DENIED}`);
        		return this.message.reply("Sorry, I need 'manage message' permissions on this channel to be able to monitor it");            		
        	
        	} else {
            
                const DatabaseHandler = require('../../utilities/db-handler.js');
                const data = new DatabaseHandler(this.clientConfig.database, this.moduleConfig.queries.SET_SETTINGS, [this.message.channel.id, toggle, toggle]);

                data.setRows().then((result) => {
                    this.message.react(this.clientConfig.reaction.SUCCESS);
                }).catch((reason) => {
                    console.log(reason);
                    this.message.react(this.clientConfig.reaction.ERROR);
                });
            
        	}
        	
        } catch(e) {
            
            //On error, log to console and return help
            console.error(e);
            return this.help();
            
        }
        
    }
    
    analyze() {

    	try {
            
            //Ignore admin or master
        	if( this.message.channel.type === "dm" || this.message.member.roles.find("name", this.clientConfig.adminRole) || this.message.author.id === this.clientConfig.master ) { return true; }
                        
            const DatabaseHandler = require('../../utilities/db-handler.js');
            const dbHandler = new DatabaseHandler(this.clientConfig.database, this.moduleConfig.queries.GET_SETTINGS, [this.message.channel.id]);
            dbHandler.getRows().then((result) => {
                
                if( typeof(result) === "undefined" || typeof(result[0]) === "undefined" || !result[0].qmonitor ) { return true; }

                //ANALYZE MESSAGE
                if( !self.message.content.match(/(.*(?:\w*|\s*)(?:\?))/gi) ) {
                    
                    const Discord = require('discord.js');
                    const embed = new Discord.RichEmbed();
                    
                    embed.setColor(0x6F9AD3);
                    embed.setTitle(`Sorry, this message has been deleted`);
                    embed.setDescription(`The channel '${self.message.channel.name}' is currently only accepting questions. Please reformat your comment into the form of a question and feel free to try again.`);
                    embed.addField(`Removed:`, self.message.content);
                    self.message.author.send({embed});
                    self.message.delete(500);
                    
                    return false;
                    
                }                   
                
            }).catch((reason) => {
                console.log(reason);        
            });

    	} catch(e) {
            console.log(e);
        }                
        
        return true;
    	
    }
    
    status() {
        
        const Discord = require('discord.js');
        let embed = new Discord.RichEmbed();
        embed.setColor(0x6F9AD3);
        embed.setTitle(this.moduleConfig.help.title);
        embed.setDescription(this.moduleConfig.help.text);
        
        try {
            const DatabaseHandler = require('../../utilities/db-handler.js');
            const dbHandler = new DatabaseHandler(this.clientConfig.database, this.moduleConfig.queries.GET_SETTINGS, [this.message.channel.id]);
            dbHandler.getRows().then((result) => {
                
                embed.addField("Status","Active and monitoring");
                embed.addField("Example",this.moduleConfig.help.example);        
                this.message.channel.send({embed}); 
                
            }).catch((reason) => {
                
                embed.addField("Status","Inactive");
                embed.addField("Example",this.moduleConfig.help.example);        
                this.message.channel.send({embed}); 
    
            });
        } catch(e) {
            console.log(e);
        }                
    }
            
}

module.exports = Command;