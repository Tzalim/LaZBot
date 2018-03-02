class Module {
    
    constructor(config, reqModule, message, cmdObj) {
        
        try {
                        
            this.clientConfig = config || null;
            this.moduleConfig = reqModule || null;
            this.message = message || null;
            this.cmdObj = cmdObj || null;
                        
        } catch(e) {
        	this.error("module.init",e);
        }
        
    }
    
    
    async doCommand() {
    
    	try {
    		let result = await require(__dirname+'/module.'+this.cmdObj.module+'/main.js').doCommand( this );
    	} catch(e) {
    		this.error('doCommand',e);
    	}
    	
    }
    
    
    async doMonitor() {
        
    	try {
    		let result = await require(__dirname+'/module.'+this.moduleConfig.id+'/main.js').doMonitor( this );
    	} catch(e) {
    		this.error('doCommand',e);
    	}
    	
    }
    
    async auth() {
    	const PermissionHandler = require(this.clientConfig.path+'/utilities/permission-handler.js');
        let pHandler = new PermissionHandler(this.clientConfig, this.moduleConfig, this.message);
        try {
        	return await pHandler.authorIs( this.moduleConfig.permission ); 
        } catch(e) {
        	this.error("module.auth",e);
        	return false;
        }
    }
    
    reply( replyObj ) {
            
        if( typeof replyObj === 'string' ) {
        	this.message.channel.send( replyObj );
        	return true;
        }
        
    	const Discord = require('discord.js');
        const embed = new Discord.RichEmbed();
        
        let color = this.moduleConfig.commands[this.cmdObj.cmd].color || '0x6F9AD3';
        replyObj.color = replyObj.color || color;
        
        embed.setColor(replyObj.color);
        
        replyObj.title = replyObj.title || this.moduleConfig.name;
        embed.setTitle(replyObj.title);         
        
        replyObj.footer = replyObj.footer || this.clientConfig.client.user.username+'  ['+this.clientConfig.settings.version+']';
        embed.setFooter(replyObj.footer);           
        //embed.setURL('https://discord.gg/XB4DKCt');
        
        replyObj.description = replyObj.description || '';
        embed.setDescription(replyObj.description);

        replyObj.fields = replyObj.fields || [];
        for( let f of replyObj.fields ) {
            f.inline = f.inline || false;
            embed.addField( f.title, f.text, f.inline );
        }
        
        try {
        	this.message.channel.send({embed});
        	return true;
        } catch(e) {
        	return this.error('module.reply',e);
        } 
        
    }
    
    
    help( helpJson, extra ) {
    
    	try {
	        let replyObj = {};
	        
	        replyObj.title  = helpJson.title;
	        
	        replyObj.description = helpJson.text;
	        //replyObj.description += '\n\nFor further assistance, bug reports or suggestions - come visit my master at https://discord.gg/XB4DKCt';
	        replyObj.description = replyObj.description.replace(/%PREFIX%/g, this.clientConfig.settings.prefix);
	        replyObj.description = replyObj.description.replace(/%COMMAND%/g, helpJson.id);
	        
	        replyObj.fields = replyObj.fields || [];
	        if( extra ) { 
	        	if( Array.isArray(extra) ) {
	        		replyObj.fields = replyObj.fields.concat(extra);
	        	} else {
	            	replyObj.fields.push(extra); 
	        	}
	        }
	        
	        if( helpJson.example ) {
		        let exampleField = {};
		        exampleField.title = 'Example';
		        exampleField.text  = helpJson.example;
		        exampleField.text  = exampleField.text.replace(/%PREFIX%/g, this.clientConfig.settings.prefix);
		        exampleField.text  = exampleField.text.replace(/%COMMAND%/g, helpJson.id);
		        replyObj.fields.push(exampleField);
	        }
        
	        return this.success( replyObj, this.clientConfig.settings.reaction.INFO );
	        
    	} catch(e) {
    		return this.error('module.help',e);
    	}
                
    }
        
    cmdlog( result, notes ) {
    	notes = notes || 'none';
    	try {
    	    let cmd = this.cmdObj.prefix+this.cmdObj.cmd;
    	    cmd += this.cmdObj.subcmd ? ' '+this.cmdObj.subcmd : '';
    		const DatabaseHandler = require(this.clientConfig.path+'/utilities/db-handler.js');
    	    let commandLog = DatabaseHandler.setRows(
	    		this.clientConfig.settings.database,
	    		"INSERT INTO `cmdlog` VALUES (?, ?, ?, ?, ?, ?)",
	    		[new Date(), cmd, this.message.channel.id, this.message.author.id, result, notes]
    	    );
    	} catch(e) {	
    		console.warn("Command logger problem!");
    		console.error(e);		
    	}
    }
    
    react(reaction) {
    	return reaction ? this.message.react(reaction) : false;        
    }
    
    success(replyObj, reaction) {
    	
    	reaction = reaction || this.clientConfig.settings.reaction.SUCCESS;
    	if( replyObj ) {
    		let sent = this.reply( replyObj );
	    	if( sent ) { 
	    		this.cmdlog(1, this.message.content); 
	            this.message.react(reaction);
	            return true;
	    	}
	    	return false;
    	}
    	this.cmdlog(1, this.message.content);
    	return true;
    	
    }
    
    silentSuccess(notes) {    	
		this.cmdlog(1, notes); 
		return true;
    }
    
    fail(reason) {
    	
    	this.cmdlog(2,reason);
        this.message.react(this.clientConfig.settings.reaction.WARNING);
    	this.reply( reason );
    	return false;

    }
    
    error(process, err) {
    	
    	this.cmdlog(3,err.message);
        this.message.react(this.clientConfig.settings.reaction.ERROR);                    
        console.warn(`[Error] : ${this.moduleConfig.id} => ${process}`);
    	console.error( err );
    	return false;
    	
    }
    
    codeBlock(str,type) {

    	type = type || "js";
        return "```"+type+"\r\n"+str+"```";
    
    }

}

module.exports = Module;