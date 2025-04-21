import axios from "axios";

export interface VoteBase {
  message: string;
  success: boolean;
  data: VoteEventWithCandidateAndVoteResult[] | UserForVoteByEvent[];
}

export interface VoteEventWithCandidateAndVoteResult {
  startAt: string;
  isForAll: boolean;
  candidates: VotedCandidate[] | null;
  votedResult: VoteResult | null;
  _id: string;
  name: string;
  isActive: boolean;
  endAt: string;
  eventType: string;
}

export interface VotedCandidate {
  _id?: string;
  name: string;
  microchip: string;
  image: string;
  voteCount: number;
}

export interface VoteResult {
  candidate: {
    microchip: string;
  };
}

export interface VoteListForUser {
  votedMicrochip: string;
  canVote: boolean;
}

export interface UserForVoteByEvent {
  voted_for: {
    _id: string;
    name: string;
    microchip: string;
    image: string;
    event: {
      _id: string;
      name: string;
    };
    votedCount: number;
  };
}

const apiKey = process.env.N8N_JAOTHUI_EVENT_API_KEY!;

export const isEventActive = async (eventId: string) => {
  const path =
    "https://n8n.jaothui.com/webhook/jaothui-event/get-vote-by-event";
  try {
    const response = await axios.get(path, {
      data: {
        eventId,
      },
      headers: {
        Authorization: apiKey,
      },
    });
    const result = response.data;

    if (result.data.length <= 0) return false;

    console.log("active: ", result.data[0].isActive);

    return result.data[0].isActive;
  } catch (error) {
    return false;
  }
};

export const getEventLeaderboard = async (eventId: string) => {
  const path =
    "https://n8n.jaothui.com/webhook/jaothui-event/get-vote-by-event";
  try {
    const response = await axios.get(path, {
      data: {
        eventId,
      },
      headers: {
        Authorization: apiKey,
      },
    });

    const result = response.data;

    if (result && result.data.length > 0) {
      const candidates = result.data[0].candidates as VotedCandidate[];
      const sorted = candidates
        .sort((a, b) => b.voteCount - a.voteCount)
        .filter((c) => c.voteCount > 0)
        .slice(0, 10);
      return sorted;
    }

    return [];
  } catch (error) {
    console.log(error);
    return [];
  }
};

//GET all vote needs to check weather that current connected user voted on which candidate ?

export const getAllVoteListForUser = async (
  wallet: string,
  eventId: string
) => {
  const path =
    "https://n8n.jaothui.com/webhook/jaothui-event/get-vote-by-event-user";
  try {
    const response = await axios.get(path, {
      data: {
        wallet,
        eventId,
      },
      headers: {
        Authorization: apiKey,
      },
    });

    const result = response.data as VoteBase;

    if (
      (result.data[0] as VoteEventWithCandidateAndVoteResult).votedResult ==
      null
    ) {
      const output = {
        votedMicrochip: (result.data[0] as VoteEventWithCandidateAndVoteResult)
          .votedResult?.candidate.microchip
          ? (result.data[0] as VoteEventWithCandidateAndVoteResult).votedResult
              ?.candidate.microchip
          : null,
        canVote: true,
      } as VoteListForUser;
      console.log(output);
      return output;
    } else {
      const output = {
        votedMicrochip: (result.data[0] as VoteEventWithCandidateAndVoteResult)
          .votedResult?.candidate.microchip,
        canVote: false,
      } as VoteListForUser;
      return output;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getUserToVoteByEvent = async (wallet: string, eventId: string) => {
  const path =
    "https://n8n.jaothui.com/webhook/jaothui-event/user-to-vote-by-event";

  try {
    const response = await axios.get(path, {
      data: {
        wallet,
        eventId,
      },
      headers: {
        Authorization: apiKey,
      },
    });

    const result = response.data as VoteBase;

    if (result.data.length <= 0) return null;

    return result.data[0] as UserForVoteByEvent;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const voteFor = async (
  microchip: string,
  wallet: string,
  eventId: string
) => {
  const path = "https://n8n.jaothui.com/webhook/jaothui-event/vote-wallet-all";
  try {
    const response = await axios.post(
      path,
      {
        eventId,
        microchip,
        fromWallet: true,
        wallet,
      },
      {
        headers: { Authorization: apiKey },
      }
    );

    const result = response.data;

    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};
