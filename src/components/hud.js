import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

/**
 * Class that creates and manages the HUD (Heads-Up Display) 
 * and cockpit interface for the player's spacecraft
 */
export class HUDSystem {
    constructor(scene, engine, canvas, gameState) {
        this.scene = scene;
        this.engine = engine;
        this.canvas = canvas;
        this.gameState = gameState;
        
        // Create a layer for HUD elements
        this.hudTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('HUD', true, scene);
        
        // HUD elements
        this.elements = {};
        
        // Message queue for comms
        this.messageQueue = [];
        this.currentMessage = null;
        
        // Initialize HUD
        this._createHUD();
    }
    
    /**
     * Creates all the HUD elements
     * @private
     */
    _createHUD() {
        // Create shield indicator
        this._createShieldIndicator();
        
        // Create health indicator
        this._createHealthIndicator();
        
        // Create energy indicator
        this._createEnergyIndicator();
        
        // Create speed gauge
        this._createSpeedGauge();
        
        // Create weapon indicator
        this._createWeaponPanel();
        
        // Create targeting display
        this._createTargetingDisplay();
        
        // Create communication panel
        this._createCommunicationPanel();
        
        // Create mission objective panel
        this._createObjectivePanel();
        
        // Create crosshair
        this._createCrosshair();
        
        // Create radar display
        this._createRadarDisplay();
        
        // Create wingman command interface
        this._createWingmanCommandInterface();
        
        // Create key bindings display (initially hidden)
        this._createKeyBindingsDisplay();
    }
    
    /**
     * Creates the health indicator
     * @private
     */
    _createHealthIndicator() {
        // Container for health display
        const healthPanel = new GUI.Rectangle();
        healthPanel.width = "200px";
        healthPanel.height = "50px";
        healthPanel.cornerRadius = 10;
        healthPanel.color = "white";
        healthPanel.thickness = 2;
        healthPanel.background = "rgba(0, 0, 0, 0.5)";
        healthPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        healthPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        healthPanel.left = 20;
        healthPanel.bottom = 90; // Position above shield indicator
        this.hudTexture.addControl(healthPanel);
        
        // Health label
        const healthLabel = new GUI.TextBlock();
        healthLabel.text = "HULL";
        healthLabel.color = "white";
        healthLabel.fontSize = 14;
        healthLabel.height = "20px";
        healthLabel.top = "-15px";
        healthPanel.addControl(healthLabel);
        
        // Health bar
        const healthBar = new GUI.Rectangle();
        healthBar.width = "180px";
        healthBar.height = "20px";
        healthBar.cornerRadius = 5;
        healthBar.color = "white";
        healthBar.thickness = 1;
        healthBar.background = "transparent";
        healthBar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        healthBar.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        healthBar.top = 5;
        healthPanel.addControl(healthBar);
        
        // Health fill
        const healthFill = new GUI.Rectangle();
        healthFill.width = 1; // Will be updated based on health value
        healthFill.height = "16px";
        healthFill.cornerRadius = 4;
        healthFill.background = "rgba(0, 255, 0, 0.8)";
        healthFill.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        healthFill.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        healthBar.addControl(healthFill);
        
        // Health percentage
        const healthText = new GUI.TextBlock();
        healthText.text = "100%";
        healthText.color = "white";
        healthText.fontSize = 14;
        healthText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        healthText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        healthBar.addControl(healthText);
        
        // Store references
        this.elements.healthPanel = healthPanel;
        this.elements.healthFill = healthFill;
        this.elements.healthText = healthText;
    }
    
    /**
     * Creates the shield strength indicator
     * @private
     */
    _createShieldIndicator() {
        // Container for shield display
        const shieldPanel = new GUI.Rectangle();
        shieldPanel.width = "200px";
        shieldPanel.height = "50px";
        shieldPanel.cornerRadius = 10;
        shieldPanel.color = "white";
        shieldPanel.thickness = 2;
        shieldPanel.background = "rgba(0, 0, 0, 0.5)";
        shieldPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        shieldPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        shieldPanel.left = 20;
        shieldPanel.bottom = 20;
        this.hudTexture.addControl(shieldPanel);
        
        // Shield label
        const shieldLabel = new GUI.TextBlock();
        shieldLabel.text = "SHIELDS-FIXED";  // Clearly mark this as changed
        shieldLabel.color = "white";
        shieldLabel.fontSize = 14;
        shieldLabel.height = "20px";
        shieldLabel.top = "-15px";
        shieldPanel.addControl(shieldLabel);
        
        // Shield bar
        const shieldBar = new GUI.Rectangle();
        shieldBar.width = "180px";
        shieldBar.height = "20px";
        shieldBar.cornerRadius = 5;
        shieldBar.color = "white";
        shieldBar.thickness = 1;
        shieldBar.background = "transparent";
        shieldBar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        shieldBar.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        shieldBar.top = 5;
        shieldPanel.addControl(shieldBar);
        
        // Shield fill
        const shieldFill = new GUI.Rectangle();
        shieldFill.width = 1; // Will be updated based on shield value
        shieldFill.height = "16px";
        shieldFill.cornerRadius = 4;
        shieldFill.background = "rgba(0, 100, 255, 0.8)";
        shieldFill.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        shieldFill.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        shieldBar.addControl(shieldFill);
        
        // Shield percentage
        const shieldText = new GUI.TextBlock();
        shieldText.text = "100%";
        shieldText.color = "white";
        shieldText.fontSize = 14;
        shieldText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        shieldText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        shieldBar.addControl(shieldText);
        
        // Store references
        this.elements.shieldPanel = shieldPanel;
        this.elements.shieldFill = shieldFill;
        this.elements.shieldText = shieldText;
    }
    
    /**
     * Creates the energy level indicator
     * @private
     */
    _createEnergyIndicator() {
        // Container for energy display
        const energyPanel = new GUI.Rectangle();
        energyPanel.width = "200px";
        energyPanel.height = "50px";
        energyPanel.cornerRadius = 10;
        energyPanel.color = "white";
        energyPanel.thickness = 2;
        energyPanel.background = "rgba(0, 0, 0, 0.5)";
        energyPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        energyPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        energyPanel.right = 20;
        energyPanel.bottom = 20;
        this.hudTexture.addControl(energyPanel);
        
        // Energy label
        const energyLabel = new GUI.TextBlock();
        energyLabel.text = "ENERGY";
        energyLabel.color = "white";
        energyLabel.fontSize = 14;
        energyLabel.height = "20px";
        energyLabel.top = "-15px";
        energyPanel.addControl(energyLabel);
        
        // Energy bar
        const energyBar = new GUI.Rectangle();
        energyBar.width = "180px";
        energyBar.height = "20px";
        energyBar.cornerRadius = 5;
        energyBar.color = "white";
        energyBar.thickness = 1;
        energyBar.background = "transparent";
        energyBar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        energyBar.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        energyBar.top = 5;
        energyPanel.addControl(energyBar);
        
        // Energy fill
        const energyFill = new GUI.Rectangle();
        energyFill.width = 1; // Will be updated based on energy value
        energyFill.height = "16px";
        energyFill.cornerRadius = 4;
        energyFill.background = "rgba(255, 200, 0, 0.8)";
        energyFill.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        energyFill.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        energyBar.addControl(energyFill);
        
        // Energy percentage
        const energyText = new GUI.TextBlock();
        energyText.text = "100%";
        energyText.color = "white";
        energyText.fontSize = 14;
        energyText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        energyText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        energyBar.addControl(energyText);
        
        // Afterburner indicator
        const afterburnerIndicator = new GUI.Ellipse();
        afterburnerIndicator.width = "15px";
        afterburnerIndicator.height = "15px";
        afterburnerIndicator.cornerRadius = 10;
        afterburnerIndicator.color = "white";
        afterburnerIndicator.thickness = 1;
        afterburnerIndicator.background = "gray";
        afterburnerIndicator.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        afterburnerIndicator.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        afterburnerIndicator.right = 10;
        afterburnerIndicator.top = 8;
        energyPanel.addControl(afterburnerIndicator);
        
        // Store references
        this.elements.energyPanel = energyPanel;
        this.elements.energyFill = energyFill;
        this.elements.energyText = energyText;
        this.elements.afterburnerIndicator = afterburnerIndicator;
    }
    
    /**
     * Creates speed gauge
     * @private
     */
    _createSpeedGauge() {
        // Container for speed gauge
        const speedPanel = new GUI.Rectangle();
        speedPanel.width = "200px";
        speedPanel.height = "100px";
        speedPanel.cornerRadius = 10;
        speedPanel.color = "white";
        speedPanel.thickness = 2;
        speedPanel.background = "rgba(0, 0, 0, 0.5)";
        speedPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        speedPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        speedPanel.left = 20;
        speedPanel.bottom = 180; // Increased position to avoid overlap with health indicator
        this.hudTexture.addControl(speedPanel);
        
        // Speed label
        const speedLabel = new GUI.TextBlock();
        speedLabel.text = "VELOCITY";
        speedLabel.color = "white";
        speedLabel.fontSize = 14;
        speedLabel.height = "20px";
        speedLabel.top = "-35px";
        speedPanel.addControl(speedLabel);
        
        // Current speed indicator
        const speedText = new GUI.TextBlock();
        speedText.text = "0 KPS";
        speedText.color = "white";
        speedText.fontSize = 24;
        speedText.height = "30px";
        speedText.top = "-10px";
        speedPanel.addControl(speedText);
        
        // Create the gauge background (arc)
        const gaugeArc = new GUI.Ellipse();
        gaugeArc.width = "150px";
        gaugeArc.height = "150px";
        gaugeArc.color = "white";
        gaugeArc.thickness = 3;
        gaugeArc.background = "transparent";
        gaugeArc.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        gaugeArc.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        gaugeArc.top = 30;
        
        // Only show top half of ellipse by using a container with clipping
        const gaugeContainer = new GUI.Rectangle();
        gaugeContainer.width = "160px";
        gaugeContainer.height = "45px";
        gaugeContainer.thickness = 0;
        gaugeContainer.background = "transparent";
        gaugeContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        gaugeContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        gaugeContainer.top = 30;
        speedPanel.addControl(gaugeContainer);
        
        // Add arc to the container
        gaugeContainer.addControl(gaugeArc);
        
        // Create the indicator needle
        const needle = new GUI.Rectangle();
        needle.width = "2px";
        needle.height = "40px";
        needle.color = "rgba(0, 255, 0, 0.8)";
        needle.background = "rgba(0, 255, 0, 0.8)";
        needle.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        needle.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        needle.transformCenterY = 1; // Set rotation point to bottom of needle
        needle.top = -20; // Adjust to point to gauge
        
        gaugeContainer.addControl(needle);
        
        // Speed tick marks and labels
        const tickCount = 5;
        const tickLabels = [];
        
        for (let i = 0; i < tickCount; i++) {
            // Tick mark
            const tick = new GUI.Rectangle();
            tick.width = "2px";
            tick.height = "10px";
            tick.color = "white";
            tick.background = "white";
            tick.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            tick.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
            tick.rotation = -Math.PI / 2 + (Math.PI * i / (tickCount - 1));
            tick.left = 65 * Math.sin(tick.rotation);
            tick.top = -65 * Math.cos(tick.rotation);
            gaugeContainer.addControl(tick);
            
            // Tick label
            const tickLabel = new GUI.TextBlock();
            tickLabel.text = `${Math.round(i * 100 / (tickCount - 1))}`;
            tickLabel.color = "white";
            tickLabel.fontSize = 10;
            tickLabel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            tickLabel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
            
            // Position label next to tick
            tickLabel.left = 80 * Math.sin(tick.rotation);
            tickLabel.top = -80 * Math.cos(tick.rotation);
            
            gaugeContainer.addControl(tickLabel);
            tickLabels.push(tickLabel);
        }
        
        // Store references
        this.elements.speedPanel = speedPanel;
        this.elements.speedText = speedText;
        this.elements.speedNeedle = needle;
        this.elements.maxSpeed = 100; // Reference for needle rotation calculation
    }
    
    /**
     * Creates the weapon selection and status panel
     * @private
     */
    _createWeaponPanel() {
        // Container for weapon display
        const weaponPanel = new GUI.Rectangle();
        weaponPanel.width = "200px";
        weaponPanel.height = "80px";
        weaponPanel.cornerRadius = 10;
        weaponPanel.color = "white";
        weaponPanel.thickness = 2;
        weaponPanel.background = "rgba(0, 0, 0, 0.5)";
        weaponPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        weaponPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        weaponPanel.right = 20;
        weaponPanel.bottom = 180; // Increased to avoid overlap with energy indicator
        this.hudTexture.addControl(weaponPanel);
        
        // Weapon label
        const weaponLabel = new GUI.TextBlock();
        weaponLabel.text = "WEAPONS";
        weaponLabel.color = "white";
        weaponLabel.fontSize = 14;
        weaponLabel.height = "20px";
        weaponLabel.top = "-25px";
        weaponPanel.addControl(weaponLabel);
        
        // Current weapon
        const currentWeapon = new GUI.TextBlock();
        currentWeapon.text = "Laser Cannon";
        currentWeapon.color = "white";
        currentWeapon.fontSize = 18;
        currentWeapon.height = "20px";
        currentWeapon.top = -5;
        weaponPanel.addControl(currentWeapon);
        
        // Weapon cooldown bar
        const cooldownBar = new GUI.Rectangle();
        cooldownBar.width = "160px";
        cooldownBar.height = "10px";
        cooldownBar.cornerRadius = 5;
        cooldownBar.color = "white";
        cooldownBar.thickness = 1;
        cooldownBar.background = "transparent";
        cooldownBar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        cooldownBar.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        cooldownBar.top = 15;
        weaponPanel.addControl(cooldownBar);
        
        // Cooldown fill
        const cooldownFill = new GUI.Rectangle();
        cooldownFill.width = 1; // Will be updated based on cooldown
        cooldownFill.height = "6px";
        cooldownFill.cornerRadius = 3;
        cooldownFill.background = "rgba(255, 100, 100, 0.8)";
        cooldownFill.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        cooldownFill.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        cooldownBar.addControl(cooldownFill);
        
        // Ammo or heat status
        const ammoText = new GUI.TextBlock();
        ammoText.text = "Ready";
        ammoText.color = "white";
        ammoText.fontSize = 14;
        ammoText.height = "20px";
        ammoText.top = 30;
        weaponPanel.addControl(ammoText);
        
        // Store references
        this.elements.weaponPanel = weaponPanel;
        this.elements.currentWeapon = currentWeapon;
        this.elements.cooldownFill = cooldownFill;
        this.elements.ammoText = ammoText;
    }
    
    /**
     * Creates the targeting display
     * @private
     */
    _createTargetingDisplay() {
        // Container for targeting display
        const targetingPanel = new GUI.Rectangle();
        targetingPanel.width = "250px";
        targetingPanel.height = "100px";
        targetingPanel.cornerRadius = 10;
        targetingPanel.color = "white";
        targetingPanel.thickness = 2;
        targetingPanel.background = "rgba(0, 0, 0, 0.5)";
        targetingPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        targetingPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        targetingPanel.top = 20;
        this.hudTexture.addControl(targetingPanel);
        
        // No target text
        const noTargetText = new GUI.TextBlock();
        noTargetText.text = "NO TARGET";
        noTargetText.color = "white";
        noTargetText.fontSize = 18;
        noTargetText.height = "30px";
        targetingPanel.addControl(noTargetText);
        
        // Target info container (hidden by default)
        const targetInfo = new GUI.Rectangle();
        targetInfo.width = "230px";
        targetInfo.height = "80px";
        targetInfo.thickness = 0;
        targetInfo.background = "transparent";
        targetInfo.isVisible = false;
        targetingPanel.addControl(targetInfo);
        
        // Target name
        const targetName = new GUI.TextBlock();
        targetName.text = "Enemy Fighter";
        targetName.color = "white";
        targetName.fontSize = 18;
        targetName.height = "20px";
        targetName.top = -25;
        targetInfo.addControl(targetName);
        
        // Target distance
        const targetDistance = new GUI.TextBlock();
        targetDistance.text = "Distance: 500m";
        targetDistance.color = "white";
        targetDistance.fontSize = 14;
        targetDistance.height = "20px";
        targetDistance.top = 0;
        targetInfo.addControl(targetDistance);
        
        // Target health bar
        const targetHealthBar = new GUI.Rectangle();
        targetHealthBar.width = "200px";
        targetHealthBar.height = "10px";
        targetHealthBar.cornerRadius = 5;
        targetHealthBar.color = "white";
        targetHealthBar.thickness = 1;
        targetHealthBar.background = "transparent";
        targetHealthBar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        targetHealthBar.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        targetHealthBar.top = 20;
        targetInfo.addControl(targetHealthBar);
        
        // Target health fill
        const targetHealthFill = new GUI.Rectangle();
        targetHealthFill.width = 1; // Will be updated based on target health
        targetHealthFill.height = "6px";
        targetHealthFill.cornerRadius = 3;
        targetHealthFill.background = "rgba(255, 0, 0, 0.8)";
        targetHealthFill.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        targetHealthFill.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        targetHealthBar.addControl(targetHealthFill);
        
        // Target lock indicator
        const targetLockIndicator = new GUI.Ellipse();
        targetLockIndicator.width = "15px";
        targetLockIndicator.height = "15px";
        targetLockIndicator.cornerRadius = 10;
        targetLockIndicator.color = "red";
        targetLockIndicator.thickness = 2;
        targetLockIndicator.background = "transparent";
        targetLockIndicator.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        targetLockIndicator.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        targetLockIndicator.right = 10;
        targetLockIndicator.top = 10;
        targetLockIndicator.isVisible = false;
        targetingPanel.addControl(targetLockIndicator);
        
        // Store references
        this.elements.targetingPanel = targetingPanel;
        this.elements.noTargetText = noTargetText;
        this.elements.targetInfo = targetInfo;
        this.elements.targetName = targetName;
        this.elements.targetDistance = targetDistance;
        this.elements.targetHealthFill = targetHealthFill;
        this.elements.targetLockIndicator = targetLockIndicator;
    }
    
    /**
     * Creates the communication panel for messages
     * @private
     */
    _createCommunicationPanel() {
        // Container for comms panel
        const commsPanel = new GUI.Rectangle();
        commsPanel.width = "400px";
        commsPanel.height = "100px";
        commsPanel.cornerRadius = 10;
        commsPanel.color = "white";
        commsPanel.thickness = 2;
        commsPanel.background = "rgba(0, 0, 0, 0.5)";
        commsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        commsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        commsPanel.left = 20;
        commsPanel.top = 20;
        commsPanel.isVisible = false; // Hidden by default
        this.hudTexture.addControl(commsPanel);
        
        // Sender name
        const senderName = new GUI.TextBlock();
        senderName.text = "Spirit:";
        senderName.color = "#8DF9FF"; // Cyan-ish
        senderName.fontSize = 16;
        senderName.height = "20px";
        senderName.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        senderName.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        senderName.top = 10;
        senderName.left = 10;
        commsPanel.addControl(senderName);
        
        // Message text
        const messageText = new GUI.TextBlock();
        messageText.text = "This is a communication message.";
        messageText.color = "white";
        messageText.fontSize = 14;
        messageText.height = "60px";
        messageText.textWrapping = true;
        messageText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        messageText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        messageText.top = 35;
        messageText.left = 10;
        commsPanel.addControl(messageText);
        
        // Store references
        this.elements.commsPanel = commsPanel;
        this.elements.senderName = senderName;
        this.elements.messageText = messageText;
    }
    
    /**
     * Creates the mission objective panel
     * @private
     */
    _createObjectivePanel() {
        // Container for objective panel
        const objectivePanel = new GUI.Rectangle();
        objectivePanel.width = "300px";
        objectivePanel.height = "auto";
        objectivePanel.cornerRadius = 10;
        objectivePanel.color = "white";
        objectivePanel.thickness = 2;
        objectivePanel.background = "rgba(0, 0, 0, 0.5)";
        objectivePanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        objectivePanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        objectivePanel.left = 20;
        objectivePanel.top = 140;
        objectivePanel.paddingTop = "10px";
        objectivePanel.paddingBottom = "10px";
        objectivePanel.adaptHeightToChildren = true;
        this.hudTexture.addControl(objectivePanel);
        
        // Objective label
        const objectiveLabel = new GUI.TextBlock();
        objectiveLabel.text = "OBJECTIVES";
        objectiveLabel.color = "white";
        objectiveLabel.fontSize = 16;
        objectiveLabel.height = "20px";
        objectiveLabel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        objectiveLabel.top = 0;
        objectivePanel.addControl(objectiveLabel);
        
        // Create a stack panel for objectives
        const objectiveList = new GUI.StackPanel();
        objectiveList.top = 25;
        objectiveList.height = "auto";
        objectiveList.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        objectiveList.isVertical = true;
        objectivePanel.addControl(objectiveList);
        
        // Store references
        this.elements.objectivePanel = objectivePanel;
        this.elements.objectiveList = objectiveList;
    }
    
    /**
     * Creates a targeting crosshair
     * @private
     */
    _createCrosshair() {
        // Container for crosshair
        const crosshair = new GUI.Ellipse();
        crosshair.width = "40px";
        crosshair.height = "40px";
        crosshair.color = "white";
        crosshair.thickness = 2;
        crosshair.background = "transparent";
        crosshair.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        crosshair.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.hudTexture.addControl(crosshair);
        
        // Inner crosshair
        const innerCrosshair = new GUI.Ellipse();
        innerCrosshair.width = "10px";
        innerCrosshair.height = "10px";
        innerCrosshair.color = "white";
        innerCrosshair.thickness = 2;
        innerCrosshair.background = "transparent";
        innerCrosshair.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        innerCrosshair.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.hudTexture.addControl(innerCrosshair);
        
        // Horizontal line
        const horizontalLine = new GUI.Rectangle();
        horizontalLine.width = "20px";
        horizontalLine.height = "2px";
        horizontalLine.color = "white";
        horizontalLine.background = "white";
        horizontalLine.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        horizontalLine.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.hudTexture.addControl(horizontalLine);
        
        // Vertical line
        const verticalLine = new GUI.Rectangle();
        verticalLine.width = "2px";
        verticalLine.height = "20px";
        verticalLine.color = "white";
        verticalLine.background = "white";
        verticalLine.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        verticalLine.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.hudTexture.addControl(verticalLine);
        
        // Store references
        this.elements.crosshair = crosshair;
        this.elements.innerCrosshair = innerCrosshair;
    }
    
    /**
     * Creates radar display
     * @private
     */
    _createRadarDisplay() {
        // Container for radar
        const radarPanel = new GUI.Ellipse();
        radarPanel.width = "150px";
        radarPanel.height = "150px";
        radarPanel.color = "white";
        radarPanel.thickness = 2;
        radarPanel.background = "rgba(0, 0, 0, 0.7)";
        radarPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        radarPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        radarPanel.bottom = 20;
        this.hudTexture.addControl(radarPanel);
        
        // Radar grid lines
        const radarGrid = new GUI.Ellipse();
        radarGrid.width = "100px";
        radarGrid.height = "100px";
        radarGrid.color = "rgba(255, 255, 255, 0.3)";
        radarGrid.thickness = 1;
        radarGrid.background = "transparent";
        radarGrid.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        radarGrid.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        radarPanel.addControl(radarGrid);
        
        // Player position indicator
        const playerIndicator = new GUI.Ellipse();
        playerIndicator.width = "8px";
        playerIndicator.height = "8px";
        playerIndicator.color = "rgba(0, 255, 0, 1)";
        playerIndicator.thickness = 0;
        playerIndicator.background = "rgba(0, 255, 0, 1)";
        playerIndicator.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        playerIndicator.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        radarPanel.addControl(playerIndicator);
        
        // Store references
        this.elements.radarPanel = radarPanel;
        this.elements.radarGrid = radarGrid;
        this.elements.playerIndicator = playerIndicator;
        this.elements.radarEnemies = []; // Will store enemy indicators
    }
    
    /**
     * Updates the HUD based on current game state
     * @param {Number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Skip if no player available
        if (!this.gameState.player) return;
        
        // Update shield display
        this._updateShieldDisplay();
        
        // Update health display
        this._updateHealthDisplay();
        
        // Update energy display
        this._updateEnergyDisplay();
        
        // Update speed gauge
        this._updateSpeedGauge();
        
        // Update weapon display
        this._updateWeaponDisplay();
        
        // Update targeting display
        this._updateTargetingDisplay();
        
        // Update communications
        this._updateCommunications(deltaTime);
        
        // Update objectives
        this._updateObjectives();
        
        // Update radar
        this._updateRadar();
        
        // Update wingman command UI if active wingman changes
        this._updateWingmanInterface();
    }
    
    /**
     * Updates shield display with current values
     * @private
     */
    _updateShieldDisplay() {
        const shields = this.gameState.player.shields || 0;
        const maxShields = 100;
        const shieldPercent = Math.floor((shields / maxShields) * 100);
        
        // Update shield bar
        this.elements.shieldFill.width = `${(shields / maxShields) * 100}%`;
        this.elements.shieldText.text = `${shieldPercent}%`;
        
        // Change color based on shield level
        if (shields < 30) {
            this.elements.shieldFill.background = "rgba(255, 0, 0, 0.8)"; // Red for low shields
        } else if (shields < 60) {
            this.elements.shieldFill.background = "rgba(255, 200, 0, 0.8)"; // Yellow for medium shields
        } else {
            this.elements.shieldFill.background = "rgba(0, 100, 255, 0.8)"; // Blue for high shields
        }
    }
    
    /**
     * Updates energy display with current values
     * @private
     */
    _updateEnergyDisplay() {
        const energy = this.gameState.player.energy || 0;
        const maxEnergy = 100;
        const energyPercent = Math.floor((energy / maxEnergy) * 100);
        
        // Update energy bar
        this.elements.energyFill.width = `${(energy / maxEnergy) * 100}%`;
        this.elements.energyText.text = `${energyPercent}%`;
        
        // Update afterburner indicator
        if (this.gameState.playerPhysics && this.gameState.playerPhysics.afterburnerActive) {
            this.elements.afterburnerIndicator.background = "rgba(255, 100, 0, 1)"; // Bright orange when active
        } else {
            this.elements.afterburnerIndicator.background = "gray";
        }
    }
    
    /**
     * Updates speed gauge with current values
     * @private
     */
    _updateSpeedGauge() {
        // Skip if the necessary elements are not available
        if (!this.elements.speedText || !this.elements.speedNeedle || !this.gameState.playerPhysics) {
            return;
        }
        
        // Get current speed from physics
        const currentSpeed = this.gameState.playerPhysics.currentSpeed || 0;
        const maxSpeed = this.elements.maxSpeed || 250;
        
        // Update speed text (KPS = Kilometers Per Second)
        const speedKPS = Math.floor(currentSpeed);
        this.elements.speedText.text = `${speedKPS} KPS`;
        
        // Change color based on speed
        if (currentSpeed > maxSpeed * 0.8) {
            // Red for high speed
            this.elements.speedText.color = "rgba(255, 100, 100, 1.0)";
        } else if (currentSpeed > maxSpeed * 0.5) {
            // Yellow for medium speed
            this.elements.speedText.color = "rgba(255, 255, 100, 1.0)";
        } else {
            // White for low speed
            this.elements.speedText.color = "white";
        }
        
        // Update needle rotation (map speed from 0-maxSpeed to -PI/2 to PI/2)
        const ratio = Math.min(currentSpeed / maxSpeed, 1);
        const angle = -Math.PI / 2 + (ratio * Math.PI);
        
        this.elements.speedNeedle.rotation = angle;
        
        // Change needle color based on speed
        if (currentSpeed > maxSpeed * 0.8) {
            this.elements.speedNeedle.background = "rgba(255, 50, 50, 0.8)";
            this.elements.speedNeedle.color = "rgba(255, 50, 50, 0.8)";
        } else if (currentSpeed > maxSpeed * 0.5) {
            this.elements.speedNeedle.background = "rgba(255, 255, 50, 0.8)";
            this.elements.speedNeedle.color = "rgba(255, 255, 50, 0.8)";
        } else {
            this.elements.speedNeedle.background = "rgba(0, 255, 0, 0.8)";
            this.elements.speedNeedle.color = "rgba(0, 255, 0, 0.8)";
        }
    }
    
    /**
     * Updates weapon display
     * @private
     */
    _updateWeaponDisplay() {
        if (!this.gameState.playerWeapons) return;
        
        // Get current weapon
        const currentWeapon = this.gameState.playerWeapons.getCurrentWeapon();
        if (!currentWeapon) return;
        
        // Update weapon name
        this.elements.currentWeapon.text = currentWeapon.name;
        
        // Update cooldown
        const cooldownFraction = this.gameState.playerWeapons.cooldownRemaining / currentWeapon.cooldown;
        this.elements.cooldownFill.width = `${cooldownFraction * 100}%`;
        
        // Update ready status
        if (cooldownFraction <= 0) {
            this.elements.ammoText.text = "Ready";
            this.elements.ammoText.color = "white";
        } else {
            this.elements.ammoText.text = "Charging";
            this.elements.ammoText.color = "yellow";
        }
    }
    
    /**
     * Updates targeting display
     * @private
     */
    _updateTargetingDisplay() {
        if (!this.gameState.playerTargeting) return;
        
        // Get current target
        const currentTarget = this.gameState.playerTargeting.getCurrentTarget();
        
        if (!currentTarget) {
            // No target
            this.elements.noTargetText.isVisible = true;
            this.elements.targetInfo.isVisible = false;
            this.elements.targetLockIndicator.isVisible = false;
            return;
        }
        
        // Show target info
        this.elements.noTargetText.isVisible = false;
        this.elements.targetInfo.isVisible = true;
        
        // Update target name
        this.elements.targetName.text = currentTarget.name || "Enemy Ship";
        
        // Update distance
        const distance = BABYLON.Vector3.Distance(
            this.gameState.player.position, 
            currentTarget.position
        );
        this.elements.targetDistance.text = `Distance: ${Math.floor(distance)}m`;
        
        // Update health bar
        const health = currentTarget.health || 0;
        const maxHealth = currentTarget.maxHealth || 100;
        this.elements.targetHealthFill.width = `${(health / maxHealth) * 100}%`;
        
        // Update lock indicator
        const isLocked = this.gameState.playerTargeting.isTargetLocked();
        this.elements.targetLockIndicator.isVisible = isLocked;
        
        // If locked, make it blink
        if (isLocked) {
            // Use elapsed time to create blinking effect
            const time = this.gameState.scene.getEngine().getTimeFrameCount() / 10;
            const blink = (Math.sin(time) + 1) / 2; // 0 to 1
            this.elements.targetLockIndicator.alpha = 0.5 + (blink * 0.5);
        }
    }
    
    /**
     * Updates comm panel with messages
     * @param {Number} deltaTime - Time since last update in seconds
     * @private
     */
    _updateCommunications(deltaTime) {
        // If there's a current message, update its timer
        if (this.currentMessage) {
            this.currentMessage.timeRemaining -= deltaTime;
            
            // Check if message has expired
            if (this.currentMessage.timeRemaining <= 0) {
                this.currentMessage = null;
                this.elements.commsPanel.isVisible = false;
                
                // If there are more messages in queue, show the next one
                if (this.messageQueue.length > 0) {
                    this._showNextMessage();
                }
            }
        }
        // If no current message and queue has messages, show the next one
        else if (this.messageQueue.length > 0 && !this.currentMessage) {
            this._showNextMessage();
        }
    }
    
    /**
     * Shows the next message in the queue
     * @private
     */
    _showNextMessage() {
        // Get the next message
        this.currentMessage = this.messageQueue.shift();
        
        // Update the comms panel
        this.elements.senderName.text = `${this.currentMessage.sender}:`;
        this.elements.messageText.text = this.currentMessage.text;
        
        // Show the panel
        this.elements.commsPanel.isVisible = true;
    }
    
    /**
     * Updates mission objectives display
     * @private
     */
    _updateObjectives() {
        // Clear existing objectives
        this.elements.objectiveList.children.forEach(child => {
            this.elements.objectiveList.removeControl(child);
        });
        
        // If no mission system, hide panel
        if (!this.gameState.missionSystem) {
            this.elements.objectivePanel.isVisible = false;
            return;
        }
        
        // Show panel
        this.elements.objectivePanel.isVisible = true;
        
        // Get objectives from mission system
        const objectives = this.gameState.missionSystem.getObjectives();
        
        // Create UI for each objective
        objectives.forEach(objective => {
            // Create container for this objective
            const objectiveContainer = new GUI.Rectangle();
            objectiveContainer.width = "280px";
            objectiveContainer.height = "30px";
            objectiveContainer.thickness = 0;
            objectiveContainer.background = "transparent";
            
            // Create checkbox
            const checkbox = new GUI.Ellipse();
            checkbox.width = "15px";
            checkbox.height = "15px";
            checkbox.color = "white";
            checkbox.thickness = 1;
            checkbox.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            checkbox.left = 5;
            
            // Set checkbox state based on objective
            if (objective.isCompleted()) {
                checkbox.background = "lime";
            } else if (objective.isFailed()) {
                checkbox.background = "red";
            } else {
                checkbox.background = "transparent";
            }
            
            objectiveContainer.addControl(checkbox);
            
            // Create objective text
            const objectiveText = new GUI.TextBlock();
            objectiveText.text = objective.getDescription();
            objectiveText.color = "white";
            objectiveText.fontSize = 14;
            objectiveText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            objectiveText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            objectiveText.left = 30;
            
            // Style text based on objective state
            if (objective.isCompleted()) {
                objectiveText.color = "lime";
            } else if (objective.isFailed()) {
                objectiveText.color = "red";
                objectiveText.text = `${objective.getDescription()} [FAILED]`;
            }
            
            objectiveContainer.addControl(objectiveText);
            
            // Add to the list
            this.elements.objectiveList.addControl(objectiveContainer);
        });
    }
    
    /**
     * Updates radar display
     * @private
     */
    _updateRadar() {
        // Clear existing enemy indicators
        this.elements.radarEnemies.forEach(indicator => {
            this.elements.radarPanel.removeControl(indicator);
        });
        this.elements.radarEnemies = [];
        
        // If no enemies, just return
        if (!this.gameState.enemies || this.gameState.enemies.length === 0) {
            return;
        }
        
        // Get player position and forward direction
        const playerPos = this.gameState.player.position;
        const playerDir = this.gameState.player.direction;
        
        // Create right vector for coordinate system
        const right = BABYLON.Vector3.Cross(playerDir, BABYLON.Vector3.Up()).normalize();
        
        // Create up vector (perpendicular to forward and right)
        const up = BABYLON.Vector3.Cross(right, playerDir).normalize();
        
        // Radar range (how far can be seen on radar)
        const radarRange = 500;
        
        // Add each enemy to radar
        this.gameState.enemies.forEach(enemy => {
            // Vector from player to enemy
            const toEnemy = enemy.position.subtract(playerPos);
            
            // Distance to enemy
            const distance = toEnemy.length();
            
            // If within radar range
            if (distance <= radarRange) {
                // Project enemy position onto player's coordinate system
                const normalizedDistance = Math.min(distance / radarRange, 1);
                
                // Get projection coordinates
                const dotRight = BABYLON.Vector3.Dot(toEnemy, right);
                const dotUp = BABYLON.Vector3.Dot(toEnemy, up);
                
                // Calculate position on radar (normalized -1 to 1)
                const radarX = dotRight / radarRange;
                const radarY = dotUp / radarRange;
                
                // Scale to radar size (75px is half the radar diameter)
                const scaledX = radarX * 60;
                const scaledY = radarY * 60;
                
                // Create enemy indicator
                const enemyIndicator = new GUI.Ellipse();
                enemyIndicator.width = "6px";
                enemyIndicator.height = "6px";
                enemyIndicator.color = "red";
                enemyIndicator.thickness = 0;
                enemyIndicator.background = "red";
                
                // Position relative to center
                enemyIndicator.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                enemyIndicator.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                enemyIndicator.left = scaledX;
                enemyIndicator.top = -scaledY; // Negate Y because GUI Y is inverted
                
                // Add to radar panel
                this.elements.radarPanel.addControl(enemyIndicator);
                
                // Store reference
                this.elements.radarEnemies.push(enemyIndicator);
            }
        });
    }
    
    /**
     * Shows a communication message
     * @param {String} text - Message text
     * @param {Number} duration - Duration to display in seconds
     * @param {String} sender - Name of sender
     * @param {String} priority - Message priority (normal, high)
     */
    showMessage(text, duration = 5, sender = "Comms", priority = "normal") {
        // Create message object
        const message = {
            text: text,
            sender: sender,
            priority: priority,
            timeRemaining: duration
        };
        
        // If priority is high, clear queue and show immediately
        if (priority === "high") {
            this.messageQueue = [message];
            this.currentMessage = null;
            this.elements.commsPanel.isVisible = false;
        } else {
            // Add to queue
            this.messageQueue.push(message);
        }
    }
    
    /**
     * Toggles the HUD visibility
     * @param {Boolean} visible - Whether the HUD should be visible
     */
    setVisible(visible) {
        this.hudTexture.rootContainer.isVisible = visible;
    }
    
    /**
     * Creates the wingman command interface
     * @private
     */
    _createWingmanCommandInterface() {
        // Container for wingman commands
        const wingmanPanel = new GUI.Rectangle();
        wingmanPanel.width = "250px";
        wingmanPanel.height = "auto";
        wingmanPanel.adaptHeightToChildren = true;
        wingmanPanel.cornerRadius = 10;
        wingmanPanel.color = "white";
        wingmanPanel.thickness = 2;
        wingmanPanel.background = "rgba(0, 0, 0, 0.5)";
        wingmanPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        wingmanPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        wingmanPanel.right = 20;
        wingmanPanel.top = 150;
        wingmanPanel.paddingTop = "10px";
        wingmanPanel.paddingBottom = "10px";
        wingmanPanel.paddingLeft = "10px";
        wingmanPanel.paddingRight = "10px";
        wingmanPanel.isVisible = false; // Hidden by default
        this.hudTexture.addControl(wingmanPanel);
        
        // Wingman command title
        const commandTitle = new GUI.TextBlock();
        commandTitle.text = "WINGMAN COMMANDS";
        commandTitle.color = "white";
        commandTitle.fontSize = 16;
        commandTitle.height = "20px";
        commandTitle.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        commandTitle.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        commandTitle.top = 5;
        wingmanPanel.addControl(commandTitle);
        
        // Active wingman text
        const activeWingman = new GUI.TextBlock();
        activeWingman.text = "Active: Spirit";
        activeWingman.color = "#8DF9FF"; // Cyan-ish
        activeWingman.fontSize = 14;
        activeWingman.height = "20px";
        activeWingman.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        activeWingman.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        activeWingman.top = 30;
        wingmanPanel.addControl(activeWingman);
        
        // Create a stack panel for commands
        const commandList = new GUI.StackPanel();
        commandList.width = "230px";
        commandList.height = "auto";
        commandList.top = 55;
        commandList.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        commandList.isVertical = true;
        commandList.spacing = 5;
        wingmanPanel.addControl(commandList);
        
        // Command button styles
        const createCommandButton = (text, key, description) => {
            const buttonContainer = new GUI.Rectangle();
            buttonContainer.width = "100%";
            buttonContainer.height = "30px";
            buttonContainer.thickness = 0;
            buttonContainer.background = "transparent";
            
            const button = GUI.Button.CreateSimpleButton("cmd_" + text, `${key}: ${text}`);
            button.width = "100%";
            button.height = "100%";
            button.color = "white";
            button.background = "rgba(40, 40, 100, 0.6)";
            button.cornerRadius = 5;
            button.fontSize = 14;
            button.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            
            // Hover effect
            button.pointerEnterAnimation = () => {
                button.background = "rgba(60, 60, 150, 0.8)";
                // Show description as tooltip
                if (this.elements.tooltipText) {
                    this.elements.tooltipText.text = description;
                    this.elements.tooltip.isVisible = true;
                }
            };
            
            button.pointerOutAnimation = () => {
                button.background = "rgba(40, 40, 100, 0.6)";
                // Hide tooltip
                if (this.elements.tooltip) {
                    this.elements.tooltip.isVisible = false;
                }
            };
            
            buttonContainer.addControl(button);
            return buttonContainer;
        };
        
        // Add command buttons
        const commands = [
            { 
                text: "Attack My Target", 
                key: "ALT+1", 
                desc: "Orders wingman to attack your current target",
                command: this.gameState.wingmanSystem ? this.gameState.wingmanSystem.commandTypes.ATTACK_TARGET : null
            },
            { 
                text: "Attack All Enemies", 
                key: "ALT+2", 
                desc: "Orders wingman to engage all nearby enemies",
                command: this.gameState.wingmanSystem ? this.gameState.wingmanSystem.commandTypes.ATTACK_ENEMIES : null
            },
            { 
                text: "Form On My Wing", 
                key: "ALT+3", 
                desc: "Orders wingman to follow you closely",
                command: this.gameState.wingmanSystem ? this.gameState.wingmanSystem.commandTypes.FORM_UP : null
            },
            { 
                text: "Break and Attack", 
                key: "ALT+4", 
                desc: "Orders wingman to break formation and seek targets",
                command: this.gameState.wingmanSystem ? this.gameState.wingmanSystem.commandTypes.BREAK_AND_ATTACK : null
            },
            { 
                text: "Defend Yourself", 
                key: "ALT+5", 
                desc: "Orders wingman to evade and defend",
                command: this.gameState.wingmanSystem ? this.gameState.wingmanSystem.commandTypes.DEFEND_SELF : null
            },
            { 
                text: "Cover Me", 
                key: "ALT+6", 
                desc: "Orders wingman to protect you",
                command: this.gameState.wingmanSystem ? this.gameState.wingmanSystem.commandTypes.COVER_ME : null
            },
            { 
                text: "Return To Base", 
                key: "ALT+7", 
                desc: "Orders wingman to return to carrier",
                command: this.gameState.wingmanSystem ? this.gameState.wingmanSystem.commandTypes.RETURN_TO_BASE : null
            },
            { 
                text: "Cycle Wingman", 
                key: "ALT+0", 
                desc: "Switch to next wingman",
                command: "CYCLE"
            }
        ];
        
        commands.forEach(cmd => {
            const button = createCommandButton(cmd.text, cmd.key, cmd.desc);
            
            // Add click handlers for each button
            const btnControl = button.children[0];
            if (btnControl) {
                btnControl.onPointerClickObservable.add(() => {
                    if (!this.gameState.wingmanSystem) return;
                    
                    if (cmd.command === "CYCLE") {
                        // Special case for cycling wingmen
                        this.gameState.wingmanSystem.cycleWingman();
                        
                        // Update the active wingman display
                        const activeWingman = this.gameState.wingmanSystem.getActiveWingman();
                        if (activeWingman) {
                            this.updateActiveWingman(activeWingman.callsign);
                        }
                    } else if (cmd.command) {
                        // Issue the command to the wingman system
                        this.gameState.wingmanSystem.issueCommand(cmd.command);
                    }
                });
            }
            
            commandList.addControl(button);
        });
        
        // Create tooltip for commands
        const tooltip = new GUI.Rectangle();
        tooltip.width = "230px";
        tooltip.height = "auto";
        tooltip.adaptHeightToChildren = true;
        tooltip.cornerRadius = 5;
        tooltip.color = "white";
        tooltip.thickness = 1;
        tooltip.background = "rgba(0, 0, 0, 0.8)";
        tooltip.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        tooltip.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        tooltip.right = 280;
        tooltip.top = 200;
        tooltip.paddingTop = "5px";
        tooltip.paddingBottom = "5px";
        tooltip.paddingLeft = "10px";
        tooltip.paddingRight = "10px";
        tooltip.isVisible = false;
        this.hudTexture.addControl(tooltip);
        
        const tooltipText = new GUI.TextBlock();
        tooltipText.text = "Command description";
        tooltipText.color = "white";
        tooltipText.fontSize = 14;
        tooltipText.textWrapping = true;
        tooltipText.width = "100%";
        tooltip.addControl(tooltipText);
        
        // Store references
        this.elements.wingmanPanel = wingmanPanel;
        this.elements.activeWingman = activeWingman;
        this.elements.commandList = commandList;
        this.elements.tooltip = tooltip;
        this.elements.tooltipText = tooltipText;
    }
    
    /**
     * Toggles the visibility of the wingman command interface
     * @param {Boolean} visible - Whether the interface should be visible
     */
    toggleWingmanCommands(visible) {
        if (visible === undefined) {
            // Toggle current state
            this.elements.wingmanPanel.isVisible = !this.elements.wingmanPanel.isVisible;
        } else {
            // Set to specified state
            this.elements.wingmanPanel.isVisible = visible;
        }
        
        // Always hide tooltip when toggling
        this.elements.tooltip.isVisible = false;
    }
    
    /**
     * Updates the wingman interface based on current game state
     * @private
     */
    _updateWingmanInterface() {
        if (!this.gameState.wingmanSystem) return;
        
        // Get the active wingman
        const activeWingman = this.gameState.wingmanSystem.getActiveWingman();
        if (activeWingman && this.elements.activeWingman) {
            this.elements.activeWingman.text = `Active: ${activeWingman.callsign}`;
        }
    }
    
    /**
     * Updates the active wingman displayed in the command interface
     * @param {String} callsign - Callsign of the active wingman
     */
    updateActiveWingman(callsign) {
        if (this.elements.activeWingman) {
            this.elements.activeWingman.text = `Active: ${callsign}`;
        }
    }
    
    /**
     * Creates the key bindings display
     * @private
     */
    _createKeyBindingsDisplay() {
        // Container for key bindings display
        const keyBindingsPanel = new GUI.Rectangle();
        keyBindingsPanel.width = "400px";
        keyBindingsPanel.height = "auto";
        keyBindingsPanel.adaptHeightToChildren = true;
        keyBindingsPanel.cornerRadius = 10;
        keyBindingsPanel.color = "white";
        keyBindingsPanel.thickness = 2;
        keyBindingsPanel.background = "rgba(0, 0, 0, 0.7)";
        keyBindingsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        keyBindingsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        keyBindingsPanel.paddingTop = "20px";
        keyBindingsPanel.paddingBottom = "20px";
        keyBindingsPanel.paddingLeft = "20px";
        keyBindingsPanel.paddingRight = "20px";
        keyBindingsPanel.isVisible = false; // Hidden by default
        this.hudTexture.addControl(keyBindingsPanel);
        
        // Key bindings title
        const keyBindingsTitle = new GUI.TextBlock();
        keyBindingsTitle.text = "KEY BINDINGS";
        keyBindingsTitle.color = "white";
        keyBindingsTitle.fontSize = 24;
        keyBindingsTitle.height = "30px";
        keyBindingsTitle.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        keyBindingsTitle.top = 0;
        keyBindingsPanel.addControl(keyBindingsTitle);
        
        // Create a stack panel for key bindings
        const bindingsList = new GUI.StackPanel();
        bindingsList.top = 40;
        bindingsList.height = "auto";
        bindingsList.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        bindingsList.isVertical = true;
        bindingsList.spacing = 10;
        keyBindingsPanel.addControl(bindingsList);
        
        // Define key bindings to display
        const bindings = [
            { key: "W / S", description: "Thrust forward / backward" },
            { key: "A / D", description: "Roll left / right" },
            { key: "↑ / ↓", description: "Pitch up / down" },
            { key: "← / →", description: "Yaw left / right" },
            { key: "SPACE", description: "Fire weapon" },
            { key: "TAB", description: "Cycle weapons" },
            { key: "T / Y", description: "Cycle targets (next / previous)" },
            { key: "R", description: "Clear targeting" },
            { key: "SHIFT", description: "Afterburner" },
            { key: "L", description: "Request landing clearance" },
            { key: "K", description: "Activate landing approach" },
            { key: "A", description: "Auto-land (when approach activated)" },
            { key: "T", description: "Takeoff (when landed)" },
            { key: "F1-F4", description: "Power management (Weapons, Engines, Shields, Balanced)" },
            { key: "Z / X / V", description: "Shield distribution (Front, Rear, Balanced)" },
            { key: "M", description: "Toggle mission objectives" },
            { key: "ALT+1-7", description: "Wingman commands" },
            { key: "ALT+0", description: "Cycle wingman" },
            { key: "ALT+W", description: "Toggle wingman command interface" }
        ];
        
        // Add each binding to the list
        bindings.forEach(binding => {
            const bindingContainer = new GUI.Rectangle();
            bindingContainer.width = "100%";
            bindingContainer.height = "30px";
            bindingContainer.thickness = 0;
            bindingContainer.background = "transparent";
            
            // Key label
            const keyLabel = new GUI.TextBlock();
            keyLabel.text = binding.key;
            keyLabel.color = "#8DF9FF"; // Cyan-ish
            keyLabel.fontSize = 16;
            keyLabel.width = "120px";
            keyLabel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            keyLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            bindingContainer.addControl(keyLabel);
            
            // Description label
            const descLabel = new GUI.TextBlock();
            descLabel.text = binding.description;
            descLabel.color = "white";
            descLabel.fontSize = 16;
            descLabel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            descLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            descLabel.left = 130;
            bindingContainer.addControl(descLabel);
            
            bindingsList.addControl(bindingContainer);
        });
        
        // Close button
        const closeButton = GUI.Button.CreateSimpleButton("closeKeyBindings", "CLOSE");
        closeButton.width = "100px";
        closeButton.height = "30px";
        closeButton.color = "white";
        closeButton.background = "rgba(100, 0, 0, 0.6)";
        closeButton.cornerRadius = 5;
        closeButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        closeButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeButton.top = "92%";
        
        // Hover effects
        closeButton.pointerEnterAnimation = () => {
            closeButton.background = "rgba(150, 0, 0, 0.8)";
        };
        
        closeButton.pointerOutAnimation = () => {
            closeButton.background = "rgba(100, 0, 0, 0.6)";
        };
        
        // Close on click
        closeButton.onPointerClickObservable.add(() => {
            this.toggleKeyBindings(false);
        });
        
        keyBindingsPanel.addControl(closeButton);
        
        // Store references
        this.elements.keyBindingsPanel = keyBindingsPanel;
    }
    
    /**
     * Toggles the key bindings display
     * @param {Boolean} visible - Whether the display should be visible
     */
    toggleKeyBindings(visible) {
        if (visible === undefined) {
            // Toggle current state
            this.elements.keyBindingsPanel.isVisible = !this.elements.keyBindingsPanel.isVisible;
        } else {
            // Set to specified state
            this.elements.keyBindingsPanel.isVisible = visible;
        }
    }
    
    /**
     * Updates health display with current values
     * @private
     */
    _updateHealthDisplay() {
        const health = this.gameState.player.health || 0;
        const maxHealth = 100;
        const healthPercent = Math.floor((health / maxHealth) * 100);
        
        // Update health bar
        this.elements.healthFill.width = `${(health / maxHealth) * 100}%`;
        this.elements.healthText.text = `${healthPercent}%`;
        
        // Change color based on health level
        if (health < 30) {
            this.elements.healthFill.background = "rgba(255, 0, 0, 0.8)"; // Red for low health
        } else if (health < 60) {
            this.elements.healthFill.background = "rgba(255, 200, 0, 0.8)"; // Yellow for medium health
        } else {
            this.elements.healthFill.background = "rgba(0, 255, 0, 0.8)"; // Green for high health
        }
    }
    
    /**
     * Disposes of the HUD resources
     */
    dispose() {
        if (this.hudTexture) {
            this.hudTexture.dispose();
        }
    }
}

/**
 * Creates and returns a HUD system
 * @param {BABYLON.Scene} scene - The scene
 * @param {BABYLON.Engine} engine - The engine
 * @param {HTMLCanvasElement} canvas - The render canvas
 * @param {Object} gameState - The game state
 * @returns {HUDSystem} The HUD system
 */
export function createHUD(scene, engine, canvas, gameState) {
    return new HUDSystem(scene, engine, canvas, gameState);
}