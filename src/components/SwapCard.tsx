
import { useState, useEffect } from "react";
import { ArrowDownUp, Settings, Loader2 } from "lucide-react";
import { NETWORKS, SLIPPAGE_OPTIONS } from "@/lib/constants";
import { Token } from "@/lib/types";
import TokenSelector from "./TokenSelector";
import NetworkSelector from "./NetworkSelector";
import SwapButton from "./SwapButton";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { fetchSymbiosisTokens, connectWallet, calculateSwapAmount } from "@/services/tokenService";

const SwapCard = () => {
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(2);
  const [walletConnected, setWalletConnected] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch tokens for the selected network
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoading(true);
      try {
        const tokens = await fetchSymbiosisTokens(selectedNetwork.id);
        setAvailableTokens(tokens);
        console.log(`Loaded ${tokens.length} tokens for ${selectedNetwork.name}`);
        
        // Reset selected tokens when network changes
        setFromToken(null);
        setToToken(null);
        setFromAmount("");
        setToAmount("");
      } catch (error) {
        console.error("Error loading tokens:", error);
        toast.error("Failed to load tokens. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTokens();
  }, [selectedNetwork]);
  
  // Handle swapping the tokens
  const handleSwapTokens = () => {
    if (!fromToken || !toToken) return;
    
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };
  
  // Handle network change
  const handleNetworkChange = (network: typeof NETWORKS[0]) => {
    setSelectedNetwork(network);
  };
  
  // Update the to amount when from amount or tokens change
  useEffect(() => {
    const calculatedAmount = calculateSwapAmount(fromToken, toToken, fromAmount);
    setToAmount(calculatedAmount);
  }, [fromToken, toToken, fromAmount]);
  
  // Handle from amount change
  const handleFromAmountChange = (value: string) => {
    // Only allow numbers and a single decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(value) || value === "") {
      setFromAmount(value);
    }
  };
  
  // Handle connect wallet
  const handleConnectWallet = async () => {
    try {
      const connected = await connectWallet();
      if (connected) {
        setWalletConnected(true);
        toast.success("Wallet connected successfully");
      } else {
        toast.error("Failed to connect wallet. Please try again.");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet. Please try again.");
    }
  };
  
  // Handle swap
  const handleSwap = () => {
    // This would be replaced with actual swap logic
    toast.success(`Swapped ${fromAmount} ${fromToken?.symbol} for ${toAmount} ${toToken?.symbol}`);
    // Reset the form
    setFromAmount("");
    setToAmount("");
  };
  
  return (
    <div className="swap-card p-5 slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-white">Swap</h2>
        <div className="flex items-center gap-3">
          <NetworkSelector 
            selectedNetwork={selectedNetwork}
            onSelectNetwork={handleNetworkChange}
          />
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="settings-button">
                <Settings className="h-4 w-4 text-white/70" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="bg-unikron-navy-light border border-unikron-blue/20 backdrop-blur-xl shadow-xl w-56 p-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white/70">Slippage Tolerance</h3>
                <div className="flex gap-2">
                  {SLIPPAGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        slippage === option 
                          ? "bg-unikron-blue text-white" 
                          : "bg-black/20 text-white/70"
                      }`}
                      onClick={() => setSlippage(option)}
                    >
                      {option}%
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 text-unikron-blue animate-spin mb-3" />
          <p className="text-white/70">Loading tokens...</p>
        </div>
      ) : (
        <>
          {/* From token input */}
          <div className="bg-black/20 rounded-xl p-4 mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/70">You give</span>
              <span className="text-sm text-unikron-blue cursor-pointer hover:text-unikron-blue-light">
                Max
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                placeholder="0"
                className="swap-input text-white"
              />
              <TokenSelector
                selectedToken={fromToken}
                onSelectToken={setFromToken}
                label="From"
                availableTokens={availableTokens}
              />
            </div>
            <div className="mt-1 text-sm text-white/50 text-left">
              {fromAmount && fromToken && parseFloat(fromAmount) > 0 && fromToken.price
                ? `~ $${(parseFloat(fromAmount) * fromToken.price).toFixed(2)}`
                : ""}
            </div>
          </div>
          
          {/* Swap direction button */}
          <div className="flex justify-center -my-4 z-10 relative">
            <button 
              className="swap-connector"
              onClick={handleSwapTokens}
              disabled={!fromToken || !toToken}
            >
              <ArrowDownUp className="h-4 w-4" />
            </button>
          </div>
          
          {/* To token input */}
          <div className="bg-black/20 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/70">You get</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={toAmount}
                readOnly
                placeholder="0"
                className="swap-input text-white"
              />
              <TokenSelector
                selectedToken={toToken}
                onSelectToken={setToToken}
                label="To"
                availableTokens={availableTokens}
              />
            </div>
            <div className="mt-1 text-sm text-white/50 text-left">
              {toAmount && toToken && parseFloat(toAmount) > 0 && toToken.price
                ? `~ $${(parseFloat(toAmount) * toToken.price).toFixed(2)}`
                : ""}
            </div>
          </div>
          
          {/* Swap button */}
          <SwapButton 
            connected={walletConnected}
            onConnect={handleConnectWallet}
            onSwap={handleSwap}
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={fromAmount}
          />
        </>
      )}
    </div>
  );
};

export default SwapCard;
